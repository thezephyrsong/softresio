import re
import json
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
SAVED_VARS_PATH = SCRIPT_DIR / "TriumDump.lua"
SPELL_CACHE_FILE = SCRIPT_DIR / "spell_cache.json"
ITEM_TOOLTIP_CACHE_FILE = SCRIPT_DIR / "item_tooltip_cache.json"
ITEMS_FILE = SCRIPT_DIR / "items.json"


def parse_lua_savedvars(file_path):
    """Parses Lua SavedVariables table exported by TriumDump."""
    if not file_path.exists():
        print(f"Error: '{file_path.name}' does not exist in {SCRIPT_DIR}")
        return {}

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read().strip()

    data = {}
    # Matches [28528] = { ... }
    item_blocks = re.findall(r'\[["\']?(\d+)["\']?\]\s*=\s*\{([^}]*)\}', content, re.DOTALL)

    for item_id_str, body in item_blocks:
        item_id = int(item_id_str)
        raw_lines = re.findall(r'"((?:[^"\\]|\\.)*)"|\'((?:[^\'\\]|\\.)*)\'', body)
        lines = []
        for match in raw_lines:
            line_str = match[0] if match[0] else match[1]
            line_str = line_str.replace(r'\"', '"').replace(r"\'", "'").replace(r'\\', '\\')
            if line_str.strip():
                lines.append(line_str.strip())

        if lines:
            data[item_id] = lines

    return data


def update_caches():
    print(f"Reading '{SAVED_VARS_PATH.name}'...")
    dumped_data = parse_lua_savedvars(SAVED_VARS_PATH)

    if not dumped_data:
        print("No item data found.")
        return

    print(f"Parsed {len(dumped_data)} items from {SAVED_VARS_PATH.name}.")

    # 1. Save Direct Item Tooltip Cache (by Item ID)
    item_tooltip_cache = {}
    if ITEM_TOOLTIP_CACHE_FILE.exists():
        try:
            with open(ITEM_TOOLTIP_CACHE_FILE, "r", encoding="utf-8") as f:
                item_tooltip_cache = json.load(f)
        except Exception:
            item_tooltip_cache = {}

    # 2. Save Spell Cache (by Spell ID)
    spell_cache = {}
    if SPELL_CACHE_FILE.exists():
        try:
            with open(SPELL_CACHE_FILE, "r", encoding="utf-8") as f:
                spell_cache = json.load(f)
        except Exception:
            spell_cache = {}

    # Load items.json to cross-reference spell IDs
    items_map = {}
    if ITEMS_FILE.exists():
        try:
            with open(ITEMS_FILE, "r", encoding="utf-8") as f:
                items_list = json.load(f)
                for item in items_list:
                    if "id" in item:
                        items_map[int(item["id"])] = item
        except Exception:
            pass

    # Hardcoded known spell maps for edge cases like Moroes' Watch
    KNOWN_SPELL_MAP = {
        28528: "34519", # Moroes' Lucky Pocket Watch
    }

    updated_items = 0
    updated_spells = 0

    for item_id, lines in dumped_data.items():
        # Store full item tooltip lines directly under Item ID
        item_tooltip_cache[str(item_id)] = lines
        updated_items += 1

        # Extract active spell lines (Use / Equip / Chance on hit)
        active_lines = [
            l for l in lines if any(l.startswith(p) for p in ["Use:", "Equip:", "Chance on hit:"])
        ]

        # Map to known spell ID if present
        if item_id in KNOWN_SPELL_MAP and active_lines:
            s_id = KNOWN_SPELL_MAP[item_id]
            use_line = next((l for l in active_lines if l.startswith("Use:")), active_lines[0])
            spell_cache[s_id] = use_line
            updated_spells += 1

        # Map to items.json spell IDs
        if item_id in items_map:
            item_data = items_map[item_id]
            for sp in item_data.get("spells", []):
                if isinstance(sp, dict) and sp.get("spell_id"):
                    s_id = str(sp["spell_id"])
                    trig = sp.get("trigger", 1)
                    target_prefix = "Use:" if trig == 0 else "Equip:"
                    matched = next((l for l in active_lines if l.startswith(target_prefix)), None)
                    if not matched and active_lines:
                        matched = active_lines[0]
                    if matched:
                        spell_cache[s_id] = matched
                        updated_spells += 1

    # Save item_tooltip_cache.json
    with open(ITEM_TOOLTIP_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(item_tooltip_cache, f, indent=2, ensure_ascii=False)

    # Save spell_cache.json
    with open(SPELL_CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(spell_cache, f, indent=2, ensure_ascii=False)

    print(f"Successfully cached {updated_items} items in '{ITEM_TOOLTIP_CACHE_FILE.name}'!")
    print(f"Successfully cached {updated_spells} spell descriptions in '{SPELL_CACHE_FILE.name}'!")


if __name__ == "__main__":
    update_caches()