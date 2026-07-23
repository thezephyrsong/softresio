import os
import sys
import json
import re
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

from lua_loot_parser import parse_lua_loot_file, merge_tables
from atlasloot_boss_map import get_boss_atlasloot_keys

LUA_LOOT_TABLES = {}  # populated by load_lua_loot_tables() if the file is found

ALL_CLASSES = [
    "Death Knight", "Druid", "Hunter", "Mage", "Paladin",
    "Priest", "Rogue", "Shaman", "Warlock", "Warrior"
]

QUALITY_MAP = {
    "Poor": 0, "Common": 1, "Uncommon": 2, "Rare": 3,
    "Epic": 4, "Legendary": 5, "Artifact": 6, "Heirloom": 7
}

SLOT_MAP = {
    "head": "Head", "neck": "Neck", "shoulder": "Shoulder", "back": "Back",
    "chest": "Chest", "shirt": "Shirt", "tabard": "Tabard", "wrist": "Wrists",
    "hands": "Hands", "waist": "Waist", "legs": "Legs", "feet": "Feet",
    "finger": "Finger", "finger1": "Finger", "finger2": "Finger",
    "trinket": "Trinket", "trinket1": "Trinket", "trinket2": "Trinket",
    "main_hand": "Main Hand", "one_hand": "One-Hand", "off_hand": "Off Hand",
    "two_hand": "Two-Hand", "ranged": "Ranged", "held_in_off_hand": "Held In Off-hand",
    "shield": "Shield", "relic": "Relic"
}

ITEMS_DB = {}
HTTP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

def load_items_db():
    global ITEMS_DB
    items_file = "items.json"
    if os.path.exists(items_file):
        print(f"Loading custom in-game item database from {items_file}...")
        with open(items_file, "r", encoding="utf-8") as f:
            try:
                raw_items = json.load(f)
                for item in raw_items:
                    if "id" in item:
                        ITEMS_DB[int(item["id"])] = item
                print(f"Successfully loaded {len(ITEMS_DB)} custom items into memory.\n")
            except Exception as e:
                print(f"Error reading {items_file}: {e}\n")
    else:
        print(f"Error: {items_file} not found! Place your in-game scraped items.json in this directory.\n")
        sys.exit(1)

def load_lua_loot_tables():
    """Loads wrathofthelichking.lua (AtlasLoot data) if present alongside the
    script. This gives us real per-difficulty (10/25) drop tables with actual
    percentages, instead of relying on wotlkdb.com scrapes that don't
    distinguish raid size."""
    global LUA_LOOT_TABLES
    lua_file = "wrathofthelichking.lua"
    if os.path.exists(lua_file):
        print(f"Loading AtlasLoot data from {lua_file}...")
        try:
            LUA_LOOT_TABLES = parse_lua_loot_file(lua_file)
            print(f"Successfully parsed {len(LUA_LOOT_TABLES)} AtlasLoot tables.\n")
        except Exception as e:
            print(f"Error reading {lua_file}: {e}\n")
            LUA_LOOT_TABLES = {}
    else:
        print(f"Notice: {lua_file} not found - 10/25 man drop % split will rely on wotlkdb.com scraping only.\n")
        LUA_LOOT_TABLES = {}


def get_lua_loot_for_boss(instance_shortname, boss_name):
    """Returns a list of {item_id, percent} dicts for this boss/difficulty
    from the AtlasLoot lua data, or None if not mapped (caller should fall
    back to scraping wotlkdb.com for this boss)."""
    if not LUA_LOOT_TABLES:
        return None
    instance_prefix = re.sub(r'(10|25)$', '', instance_shortname)
    is_25man = instance_shortname.endswith('25')
    keys = get_boss_atlasloot_keys(instance_prefix, boss_name, is_25man)
    if not keys:
        return None
    return merge_tables(LUA_LOOT_TABLES, keys)


def extract_drops_from_html(text):
    drops = []
    pattern = r'["\']?id["\']?\s*:\s*["\']drops?(?:-\d+)?["\'].*?["\']?data["\']?\s*:\s*\['
    
    for match in re.finditer(pattern, text, re.DOTALL | re.IGNORECASE):
        start_idx = match.end() - 1
        depth = 0
        end_idx = -1
        
        for i in range(start_idx, len(text)):
            if text[i] == '[':
                depth += 1
            elif text[i] == ']':
                depth -= 1
                if depth == 0:
                    end_idx = i + 1
                    break
                    
        if end_idx != -1:
            raw_array = text[start_idx:end_idx]
            id_matches = list(re.finditer(r'(?:["\']id["\']|\bid\b)\s*:\s*(\d+)', raw_array))
            
            for idx, m in enumerate(id_matches):
                item_id = int(m.group(1))
                next_start = id_matches[idx + 1].start() if idx + 1 < len(id_matches) else len(raw_array)
                snippet = raw_array[m.start():next_start]
                
                pct_m = re.search(r'(?:["\']percent["\']|\bpercent\b)\s*:\s*([\d.]+)', snippet)
                percent = float(pct_m.group(1)) if pct_m else 0.0
                
                grp_m = re.search(r'(?:["\']group["\']|\bgroup\b)\s*:\s*(\d+)', snippet)
                group = int(grp_m.group(1)) if grp_m else 0

                icon_m = re.search(r'(?:["\']icon["\']|\bicon\b)\s*:\s*["\']([^"\']+)["\']', snippet)
                icon = icon_m.group(1) if icon_m else "inv_misc_questionmark"
                
                drops.append({
                    "id": item_id,
                    "percent": percent,
                    "group": group,
                    "icon": icon
                })
                
    return drops

def collect_drops_npc(items):
    result = {}
    for item in items:
        item_id = item["id"]
        if item_id not in result:
            result[item_id] = {
                "id": item_id,
                "icon": item.get("icon", "inv_misc_questionmark"),
                "drops": []
            }
        result[item_id]["drops"].append({
            "group": item.get("group", 0),
            "percent": item.get("percent", 0)
        })
    return list(result.values())

def get_classes_from_tooltip(tooltip):
    tooltip_str = "\n".join(tooltip) if isinstance(tooltip, list) else str(tooltip)
    match = re.search(r"Classes:\s*([^\n\r<]+)", tooltip_str, re.IGNORECASE)
    if match:
        class_text = match.group(1)
        found = [c for c in ALL_CLASSES if c.lower() in class_text.lower()]
        return found if found else ALL_CLASSES
    return ALL_CLASSES

def format_icon(icon_name):
    if not icon_name or icon_name == "inv_misc_questionmark":
        return "inv_misc_questionmark.png"
    clean_icon = icon_name.lower().strip()
    return clean_icon + ".png" if not clean_icon.endswith(".png") else clean_icon

def get_item_info_local_only(item_id, icon_hint="inv_misc_questionmark"):
    item_id = int(item_id)
    icon_formatted = format_icon(icon_hint)

    if item_id in ITEMS_DB:
        item = ITEMS_DB[item_id]

        raw_q = item.get("quality", 4)
        quality = QUALITY_MAP.get(raw_q, raw_q) if isinstance(raw_q, str) else raw_q

        slot_raw = item.get("slot", "")
        slots = [SLOT_MAP.get(slot_raw.lower(), slot_raw.title())] if slot_raw else ["Unknown"]

        subclass_raw = item.get("subclass", "")
        types = [subclass_raw] if subclass_raw else ["Unknown"]

        tooltip = item.get("tooltip", [item.get("name", f"Item #{item_id}")])
        classes = get_classes_from_tooltip(tooltip)

        return {
            "name": item.get("name", f"Item #{item_id}"),
            "quality": quality,
            "tooltip": tooltip,
            "icon": icon_formatted,
            "classes": classes,
            "slots": slots,
            "types": types,
            "is_missing": False
        }
    else:
        return {
            "name": f"Item #{item_id}",
            "quality": 4,
            "tooltip": [f"Item #{item_id}"],
            "icon": icon_formatted,
            "classes": ALL_CLASSES,
            "slots": ["Unknown"],
            "types": ["Unknown"],
            "is_missing": True
        }

def fetch_npc_loot(npc_task):
    boss_id, boss_name, npc_id, npc_name, npc_link = npc_task
    try:
        res = requests.get(npc_link, headers=HTTP_HEADERS, timeout=5)
        if res.status_code == 200 and "Just a moment..." not in res.text:
            raw_drops = extract_drops_from_html(res.text)
            return boss_id, npc_id, collect_drops_npc(raw_drops)
    except Exception:
        pass
    return boss_id, npc_id, []

def add_item_drop(instance_items_map, missing_items, item_id, chance, boss_id, npc_id, icon_hint="inv_misc_questionmark"):
    item_meta = get_item_info_local_only(item_id, icon_hint)

    if item_meta["is_missing"]:
        missing_items.add(item_id)

    if item_id not in instance_items_map:
        instance_items_map[item_id] = {
            "id": item_id,
            "name": item_meta["name"],
            "classes": item_meta["classes"],
            "quality": item_meta["quality"],
            "tooltip": item_meta["tooltip"],
            "icon": item_meta["icon"],
            "dropsFrom": [],
            "slots": item_meta["slots"],
            "types": item_meta["types"]
        }

    instance_items_map[item_id]["dropsFrom"].append({
        "chance": chance,
        "bossId": boss_id,
        "npcId": npc_id
    })


def extract_loot_instance(instance):
    instance_items_map = {}
    bosses = []
    npcs = []
    tasks = []
    missing_items = set()

    for boss in instance.get("bosses", []):
        boss_id = len(bosses)
        bosses.append({"id": boss_id, "name": boss["name"]})

        boss_npcs = boss.get("npcs", [])
        first_npc_id_for_boss = len(npcs)
        for npc_info in boss_npcs:
            npc_id = len(npcs)
            npcs.append({"id": npc_id, "name": npc_info["name"], "bossId": boss_id})

        lua_items = get_lua_loot_for_boss(instance["shortname"], boss["name"])
        if lua_items is not None:
            for drop in lua_items:
                chance = drop["percent"] if drop["percent"] is not None else 0.0
                add_item_drop(
                    instance_items_map, missing_items,
                    drop["item_id"], chance, boss_id, first_npc_id_for_boss
                )
        else:
            for i, npc_info in enumerate(boss_npcs):
                npc_id = first_npc_id_for_boss + i
                tasks.append((boss_id, boss["name"], npc_id, npc_info["name"], npc_info["link"]))

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(fetch_npc_loot, task) for task in tasks]
        for future in as_completed(futures):
            boss_id, npc_id, npc_drops = future.result()

            for drop in npc_drops:
                icon_hint = drop.get("icon", "inv_misc_questionmark")

                at_least_one = 1.0
                for d in drop["drops"]:
                    pct = d.get("percent", 0)
                    at_least_one *= (1.0 - pct / 100.0)
                at_least_one = round((1.0 - at_least_one) * 100, 2)

                add_item_drop(
                    instance_items_map, missing_items,
                    drop["id"], at_least_one, boss_id, npc_id, icon_hint
                )

    if missing_items:
        print(f"\n  [NOTICE] {len(missing_items)} items missing from local items.json for {instance['name']}: {sorted(list(missing_items))}")

    return list(instance_items_map.values()), bosses, npcs

def main():
    load_items_db()
    load_lua_loot_tables()

    config_file = None
    for candidate in ["instances_wotlk.json", "instances-wotlk.json", "instances.json"]:
        if os.path.exists(candidate):
            config_file = candidate
            break

    if not config_file:
        print("Error: Could not find instances_wotlk.json!")
        sys.exit(1)

    print(f"Reading instance configuration from {config_file}...")
    with open(config_file, "r", encoding="utf-8") as f:
        instances = json.load(f)

    output_dir = os.path.join("..", "triumvirate")
    os.makedirs(output_dir, exist_ok=True)

    for instance in tqdm(instances, desc="Processing Raids"):
        if not instance.get("enabled", True):
            print(f"Skipping {instance['name']} (marked as disabled)")
            continue

        items, bosses, npcs = extract_loot_instance(instance)

        out_data = {
            "id": instance["id"],
            "shortname": instance["shortname"],
            "raid": instance.get("raid", True),
            "name": instance["name"],
            "items": items,
            "bosses": bosses,
            "npcs": npcs
        }

        out_filename = os.path.join(output_dir, f"{instance['shortname']}.json")
        with open(out_filename, "w", encoding="utf-8") as f:
            json.dump(out_data, f, indent=2)

if __name__ == "__main__":
    main()