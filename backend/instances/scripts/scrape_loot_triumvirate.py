import os
import sys
import json
import re
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

from lua_loot_parser import parse_lua_loot_file, merge_tables
from atlasloot_boss_map import get_boss_atlasloot_keys, get_boss_max_section
from parse_triumdump_lua import parse_triumdump_lua
from excluded_items import is_item_excluded

LUA_LOOT_TABLES = {}  # populated by load_lua_loot_tables() if the file is found
ITEM_NAME_CACHE = {}  # item_id -> name fetched from wotlkdb.com (or None if not found)
TRIUMDUMP_DATA = {}  # item_id -> raw in-game tooltip lines, if TriumDump.lua is found

# Global Icon Cache setup
ICON_CACHE_FILE = "icon_cache.json"
ICON_CACHE = {}  # Map of item_id (str) -> icon_name (e.g. "inv_weapon_shortblade_01.jpg")

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

# Custom Token Overrides (Boss Name/Key substring -> List of Token IDs)
CUSTOM_BOSS_DROPS = {
    # Karazhan
    "Prince Malchezaar": [92026, 92027, 92028],       # Head
    "Netherspite": [92032, 92033, 92034],              # Shoulders

    # Obsidian Sanctum
    "Sartharion": [92023, 92024, 92025],               # Hands

    # Ruins of Ahn'Qiraj (AQ20)
    "Ossirian": [92020, 92021, 92022],                 # Chest
    "Ayamiss": [92032, 92033, 92034],                  # Shoulders

    # Onyxia's Lair
    "Onyxia": [92029, 92030, 92031],                   # Legs
    # --- Zul'Aman Timed Event Chests ---
    "First Hostage Chest": [
        33590,  # Cloak of Fiends
        33591,  # Shadowcaster's Drape
        33489,  # Mantle of Ill Intent
        33480,  # Cord of Braided Troll Hair
        33971,  # Elunite Imbued Leggings
        33483,  # Life-step Belt
        33805,  # Shadowhunter's Treads
        33481,  # Pauldrons of Stone Resolve
    ],
    "Second Hostage Chest": [
        33493,  # Umbral Shiv
        33495,  # Rage
        33491,  # Tuskbreaker
        33492,  # Trollbane
        33494,  # Amani Divining Staff
        33490,  # Staff of Dark Mending
    ],
    "Third Hostage Chest": [
        33497,  # Mana Attuned Band
        33500,  # Signet of Eternal Life
        33496,  # Signet of Primal Wrath
        33499,  # Signet of the Last Defender
        33498,  # Signet of the Quiet Forest
    ],
    "Fourth Hostage Chest": [
        33809,  # Amani War Bear
    ],
}

CLASS_BITMASK = {
    1: "Warrior",
    2: "Paladin",
    4: "Hunter",
    8: "Rogue",
    16: "Priest",
    32: "Death Knight",
    64: "Shaman",
    128: "Mage",
    256: "Warlock",
    1024: "Druid",
}


def get_classes_from_bitmask(mask):
    if mask is None:
        return ALL_CLASSES
    result = [name for bit, name in CLASS_BITMASK.items() if mask & bit]
    return result if result else ALL_CLASSES


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
    if not LUA_LOOT_TABLES:
        return None
    instance_prefix = re.sub(r'(10|25)$', '', instance_shortname)
    is_25man = instance_shortname.endswith('25')
    keys = get_boss_atlasloot_keys(instance_prefix, boss_name, is_25man)
    if not keys:
        return None
    max_section = get_boss_max_section(instance_prefix, boss_name)
    return merge_tables(LUA_LOOT_TABLES, keys, max_section=max_section)


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
        return "inv_misc_questionmark.jpg"
    clean_icon = icon_name.lower().strip()
    return clean_icon + ".jpg" if not clean_icon.endswith(".jpg") else clean_icon


def fetch_item_name_from_wotlkdb(item_id):
    if item_id in ITEM_NAME_CACHE:
        return ITEM_NAME_CACHE[item_id]

    name = None
    try:
        res = requests.get(
            f"https://wotlkdb.com/?item={item_id}",
            headers=HTTP_HEADERS,
            timeout=5,
        )
        if res.status_code == 200 and "Just a moment..." not in res.text:
            title_m = re.search(r"<title>(.*?)</title>", res.text, re.DOTALL)
            if title_m:
                candidate = title_m.group(1).split(" - ")[0].strip()
                if candidate and candidate.lower() != "wotlk database 3.3.5a":
                    name = candidate
    except Exception:
        pass

    ITEM_NAME_CACHE[item_id] = name
    return name


def load_icon_cache():
    global ICON_CACHE
    if os.path.exists(ICON_CACHE_FILE):
        try:
            with open(ICON_CACHE_FILE, "r", encoding="utf-8") as f:
                ICON_CACHE = json.load(f)
            print(f"Loaded {len(ICON_CACHE)} cached item icons from {ICON_CACHE_FILE}.")
        except Exception as e:
            print(f"Warning: Failed to load icon cache ({e}). Starting fresh.")
            ICON_CACHE = {}
    else:
        ICON_CACHE = {}


def save_icon_cache():
    try:
        with open(ICON_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(ICON_CACHE, f, indent=2)
        print(f"Successfully saved {len(ICON_CACHE)} icons to {ICON_CACHE_FILE}.")
    except Exception as e:
        print(f"Error saving icon cache: {e}")


def normalize_icon_name(raw_icon: str) -> str:
    if not raw_icon:
        return "inv_misc_questionmark.jpg"
    
    clean_name = raw_icon.split('/')[-1]
    clean_name = re.sub(r'\.(png|jpg|jpeg|tga)$', '', clean_name, flags=re.IGNORECASE).strip().lower()
    return f"{clean_name}.jpg"


def fetch_wotlkdb_icon(item_id: int | str) -> str:
    str_id = str(item_id)
    
    # 1. Return from Cache if available
    if str_id in ICON_CACHE and ICON_CACHE[str_id]:
        return ICON_CACHE[str_id]

    # 2. Network Fetch from wotlkdb.com with user-agent headers
    url = f"https://wotlkdb.com/?item={str_id}"
    try:
        resp = requests.get(url, headers=HTTP_HEADERS, timeout=5)
        if resp.status_code == 200:
            patterns = [
                r'["\']?icon["\']?\s*:\s*["\']([^"\']+)["\']',
                r'icon\s*=\s*["\']([^"\']+)["\']'
            ]
            for pattern in patterns:
                match = re.search(pattern, resp.text, re.IGNORECASE)
                if match:
                    icon_raw = match.group(1)
                    formatted_icon = normalize_icon_name(icon_raw)
                    
                    ICON_CACHE[str_id] = formatted_icon
                    return formatted_icon
    except Exception as e:
        print(f"Error fetching wotlkdb.com icon for Item {item_id}: {e}")

    fallback_icon = "inv_misc_questionmark.jpg"
    ICON_CACHE[str_id] = fallback_icon
    return fallback_icon


def _html_escape(s):
    return (
        str(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def build_tooltip_html(name, quality, tooltip_lines, slot_label=""):
    lines = list(tooltip_lines)
    if lines and lines[0] == name:
        lines = lines[1:]

    equip_lines = [
        l for l in lines
        if l.startswith("Equip:") or l.startswith("Chance on hit:") or l.startswith("Use:")
    ]
    base_lines = [l for l in lines if l not in equip_lines]

    if not slot_label:
        slot_label = detect_slot_label_from_lines([name] + base_lines)

    slot_line_idx = None
    if slot_label:
        for i, line in enumerate(base_lines):
            if line == slot_label or line.startswith(slot_label + " "):
                slot_line_idx = i
                break

    parts = [f'<table><tr><td><b class="q{quality}">{_html_escape(name)}</b><br />']
    for i, line in enumerate(base_lines):
        if i == slot_line_idx:
            right = line[len(slot_label):].strip().lstrip("-").strip()
            parts.append(
                f'<table width="100%"><tr><td>{_html_escape(slot_label)}</td>'
                f'<th>{_html_escape(right)}</th></tr></table>'
            )
        else:
            parts.append(f'{_html_escape(line)}<br />')
    parts.append('</td></tr></table>')

    if equip_lines:
        parts.append('<table><tr><td>')
        for line in equip_lines:
            parts.append(f'<span class="q2">{_html_escape(line)}</span><br />')
        parts.append('</td></tr></table>')

    return "".join(parts)


EQUIP_STAT_PHRASES = {
    "hit rating": "Improves hit rating by {value}.",
    "critical strike rating": "Improves critical strike rating by {value}.",
    "haste rating": "Improves haste rating by {value}.",
    "expertise rating": "Increases your expertise rating by {value}.",
    "armor penetration rating": "Increases your armor penetration rating by {value}.",
    "defense rating": "Increases your defense rating by {value}.",
    "dodge rating": "Increases your dodge rating by {value}.",
    "parry rating": "Increases your parry rating by {value}.",
    "block rating": "Increases your shield block rating by {value}.",
    "resilience rating": "Improves your resilience rating by {value}.",
    "attack power": "Increases attack power by {value}.",
    "ranged attack power": "Increases ranged attack power by {value}.",
    "spell power": "Increases spell power by {value}.",
    "spell damage": "Increases damage done by magical spells and effects by up to {value}.",
    "healing power": "Increases healing done by spells and effects by up to {value}.",
    "mana regeneration": "Restores {value} mana per 5 sec.",
    "mp5": "Restores {value} mana per 5 sec.",
    "health regeneration": "Restores {value} health per 5 sec.",
    "hp5": "Restores {value} health per 5 sec.",
    "spell penetration": "Decreases the magical resistance of spell targets by {value}.",
}

PLAIN_STAT_NAMES = {
    "strength", "agility", "stamina", "intellect", "spirit",
    "arcane resistance", "fire resistance", "frost resistance",
    "nature resistance", "shadow resistance",
}

STAT_DISPLAY_ORDER = [
    "strength", "agility", "stamina", "intellect", "spirit",
    "arcane resistance", "fire resistance", "frost resistance",
    "nature resistance", "shadow resistance",
]


def _stat_sort_key(stat_name_value, base_index):
    stat_name, _ = stat_name_value
    key = stat_name.strip().lower()
    if key in STAT_DISPLAY_ORDER:
        return (0, STAT_DISPLAY_ORDER.index(key))
    return (1, base_index)


def build_tooltip_html_from_stats(name, quality, slot, item_level, required_level, stats):
    armor_value = None
    equip_stats = []
    plain_stats = []
    for stat in stats:
        value = stat.get("value")
        stat_name = stat.get("stat_name", "")
        if value is None or not stat_name:
            continue
        key = stat_name.strip().lower()
        if key == "armor":
            armor_value = value
        elif key in PLAIN_STAT_NAMES:
            plain_stats.append((stat_name, value))
        else:
            equip_stats.append((stat_name, value))

    plain_stats = [
        stat for _, stat in sorted(
            enumerate(plain_stats), key=lambda pair: _stat_sort_key(pair[1], pair[0])
        )
    ]

    parts = [f'<table><tr><td><b class="q{quality}">{_html_escape(name)}</b><br />']

    if slot and slot != "Non-equippable":
        parts.append(
            f'<table width="100%"><tr><td>{_html_escape(slot)}</td><th></th></tr></table>'
        )

    if armor_value is not None:
        parts.append(f'{armor_value} Armor<br />')

    for stat_name, value in plain_stats:
        sign = "+" if value >= 0 else ""
        parts.append(f'{sign}{value} {_html_escape(stat_name)}<br />')

    if required_level and required_level > 1:
        parts.append(f'Requires Level {required_level}<br />')

    parts.append('</td></tr></table>')

    if equip_stats:
        parts.append('<table><tr><td>')
        for stat_name, value in equip_stats:
            phrase = EQUIP_STAT_PHRASES.get(stat_name.strip().lower())
            if not phrase:
                phrase = "Improves your " + stat_name.lower() + " by {value}."
            parts.append(
                f'<span class="q2">Equip: {phrase.format(value=value)}</span><br />'
            )
        parts.append('</td></tr></table>')

    return "".join(parts)


def load_triumdump():
    global TRIUMDUMP_DATA
    path = "TriumDump.lua"
    if os.path.exists(path):
        print(f"Loading in-game tooltip dump from {path}...")
        try:
            TRIUMDUMP_DATA = parse_triumdump_lua(path)
            print(f"Successfully parsed {len(TRIUMDUMP_DATA)} real item tooltips from TriumDump.\n")
        except Exception as e:
            print(f"Error reading {path}: {e}\n")
            TRIUMDUMP_DATA = {}
    else:
        print(f"Notice: {path} not found - Equip:/Use: effect text and Binds/Unique lines will rely on other sources.\n")
        TRIUMDUMP_DATA = {}


KNOWN_SLOT_LABELS = sorted(set(SLOT_MAP.values()) | {"Non-equippable"}, key=len, reverse=True)


def extract_slot_and_type(triumdump_lines):
    """
    Parses TriumDump tooltip lines to extract slot (e.g., "Legs", "Back") 
    and subtype (e.g., "Cloth", "Leather", "Dagger", "Cloak").
    """
    # Mapping for standalone slots without a " - Subtype" string
    STANDALONE_SLOTS = {
        "Back": ("Back", "Cloak"),
        "Trinket": ("Trinket", "Trinket"),
        "Finger": ("Finger", "Ring"),
        "Neck": ("Neck", "Neck"),
        "Shield": ("Shield", "Shield"),
        "Held in Off-hand": ("Held in Off-hand", "Off-Hand"),
        "Shirt": ("Shirt", "Shirt"),
        "Tabard": ("Tabard", "Tabard"),
        "Relic": ("Relic", "Relic"),
    }

    # IMPORTANT: Only scan lines 1-5. Item slot/type is always near the top.
    # Scanning all lines causes false-positives on equip effects or set bonuses with " - ".
    for line in triumdump_lines[1:6]:
        line_clean = line.strip()

        # Handle lines formatted as "Slot - Subtype" (e.g., "Legs - Cloth", "Hands - Cloth")
        if " - " in line_clean:
            parts = [p.strip() for p in line_clean.split(" - ", 1)]
            return parts[0], parts[1]

        # Handle single-word slot lines (e.g., "Back", "Trinket")
        if line_clean in STANDALONE_SLOTS:
            return STANDALONE_SLOTS[line_clean]

    return "Unknown", "Unknown"


def _resolve_quality_slot_classes(item, fallback_lines):
    if isinstance(item.get("quality"), dict):
        quality = item["quality"].get("id", 4)
        slot_field = item.get("slot")
        slot_label = (
            slot_field.get("name") if isinstance(slot_field, dict)
            else (slot_field or "Unknown")
        )
        classes = get_classes_from_bitmask(item.get("allowable_classes"))
    else:
        raw_q = item.get("quality", 4)
        quality = QUALITY_MAP.get(raw_q, raw_q) if isinstance(raw_q, str) else raw_q
        slot_raw = item.get("slot", "")
        slot_label = SLOT_MAP.get(slot_raw.lower(), slot_raw.title()) if slot_raw else "Unknown"
        classes = get_classes_from_tooltip(item.get("tooltip", fallback_lines))
    return quality, slot_label, classes


def get_item_icon(item_id: int | str, local_item_data: dict = None, icon_hint: str = None) -> str:
    if local_item_data:
        icon_raw = (
            local_item_data.get("icon") or 
            local_item_data.get("iconName") or 
            local_item_data.get("icon_name")
        )
        if icon_raw:
            return normalize_icon_name(icon_raw)

    if icon_hint and icon_hint != "inv_misc_questionmark":
        return normalize_icon_name(icon_hint)

    return fetch_wotlkdb_icon(item_id)


def get_item_info_local_only(item_id, icon_hint="inv_misc_questionmark"):
    item_id = int(item_id)
    triumdump_lines = TRIUMDUMP_DATA.get(item_id)
    db_item = ITEMS_DB.get(item_id)

    icon_formatted = get_item_icon(item_id, db_item, icon_hint)

    if triumdump_lines:
        item_name = triumdump_lines[0]
        
        # Extract slot and item type directly from TriumDump lines
        slot_label, item_type = extract_slot_and_type(triumdump_lines)

        if db_item:
            quality, _, classes = _resolve_quality_slot_classes(db_item, triumdump_lines)
        else:
            quality = 4
            classes = get_classes_from_tooltip(triumdump_lines)

        tooltip_html = build_tooltip_html(item_name, quality, triumdump_lines, slot_label)
        
        return {
            "name": item_name,
            "quality": quality,
            "tooltip": tooltip_html,
            "icon": icon_formatted,
            "classes": classes,
            "slots": [slot_label] if slot_label != "Unknown" else ["Unknown"],
            "types": [item_type] if item_type != "Unknown" else ["Unknown"],
            "is_missing": False
        }

    if db_item:
        item = db_item
        item_name = item.get("name", f"Item #{item_id}")
        quality, slot_label, classes = _resolve_quality_slot_classes(item, [item_name])

        if isinstance(item.get("quality"), dict):
            types = ["Unknown"]
            tooltip_html = build_tooltip_html_from_stats(
                item_name, quality, slot_label,
                item.get("item_level", 0), item.get("required_level", 1),
                item.get("stats", []),
            )
        else:
            subclass_raw = item.get("subclass", "")
            types = [subclass_raw] if subclass_raw else ["Unknown"]
            tooltip = item.get("tooltip", [item_name])
            tooltip_html = build_tooltip_html(item_name, quality, tooltip, slot_label)

        return {
            "name": item_name,
            "quality": quality,
            "tooltip": tooltip_html,
            "icon": icon_formatted,
            "classes": classes,
            "slots": [slot_label],
            "types": types,
            "is_missing": False
        }
    else:
        fetched_name = fetch_item_name_from_wotlkdb(item_id)
        name = fetched_name or f"Item #{item_id}"
        tooltip_html = build_tooltip_html(name, 4, [name])
        return {
            "name": name,
            "quality": 4,
            "tooltip": tooltip_html,
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


def add_item_drop(instance_items_map, missing_items, item_id, chance, boss_id, npc_id, instance_shortname, icon_hint="inv_misc_questionmark"):
    if is_item_excluded(item_id, instance_shortname):
        return

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
                    drop["item_id"], chance, boss_id, first_npc_id_for_boss,
                    instance["shortname"]
                )
        else:
            for i, npc_info in enumerate(boss_npcs):
                npc_id = first_npc_id_for_boss + i
                tasks.append((boss_id, boss["name"], npc_id, npc_info["name"], npc_info["link"]))

        boss_name = boss["name"]
        for custom_boss, token_ids in CUSTOM_BOSS_DROPS.items():
            if custom_boss.lower() in boss_name.lower():
                for token_id in token_ids:
                    add_item_drop(
                        instance_items_map,
                        missing_items,
                        token_id,
                        0.0,
                        boss_id,
                        first_npc_id_for_boss,
                        instance["shortname"]
                    )

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
                    drop["id"], at_least_one, boss_id, npc_id,
                    instance["shortname"], icon_hint
                )

    if missing_items:
        print(f"\n  [NOTICE] {len(missing_items)} items missing from local items.json for {instance['name']}: {sorted(list(missing_items))}")

    return list(instance_items_map.values()), bosses, npcs


def main():
    load_items_db()
    load_lua_loot_tables()
    load_triumdump()
    load_icon_cache()

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

    try:
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
    finally:
        save_icon_cache()


if __name__ == "__main__":
    main()