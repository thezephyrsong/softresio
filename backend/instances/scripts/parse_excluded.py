import re

# Path definitions
INPUT_FILE = "excludeditems.txt"
OUTPUT_FILE = "excluded_items.py"

# Regex matches AtlasLoot Lua format: { <index>, <item_id>, "<icon>", "<name>", ... }
# Example line: { 2, 16720, "", "=q3=Wildheart Cowl", ... }
pattern = re.compile(r'\{\s*\d+,\s*(\d+),\s*"[^"]*",\s*"([^"]+)"')

extracted_items = []
seen_ids = set()

print(f"Reading '{INPUT_FILE}'...")

with open(INPUT_FILE, "r", encoding="utf-8", errors="ignore") as f:
    for line in f:
        match = pattern.search(line)
        if match:
            item_id = int(match.group(1))
            raw_name = match.group(2)
            
            # Skip non-item placeholders (ID 0)
            if item_id == 0:
                continue
                
            # Strip AtlasLoot quality formatting (e.g. "=q3=Wildheart Cowl" -> "Wildheart Cowl")
            clean_name = re.sub(r'=q\d+=', '', raw_name).strip()
            
            if item_id not in seen_ids:
                seen_ids.add(item_id)
                extracted_items.append((item_id, clean_name))

print(f"Found {len(extracted_items)} unique item IDs.")

# Format each item ID entry with a clean comment
formatted_entries = [f"    {item_id},  # {name}" for item_id, name in extracted_items]
ids_block = "\n".join(formatted_entries)

# Build the complete content for excluded_items.py
py_content = f'''"""
Item IDs to drop from the scraped output entirely, regardless of which boss
or instance they came from. This runs *before* an item is ever written to
the instance JSON, so excluded items never show up in SR pickers, HR
pickers, or the loot browser for anyone.
"""

# Hidden from every instance, no matter where they drop.
EXCLUDED_ITEM_IDS: set[int] = set([
{ids_block}
])

# Hidden only within the listed instance(s)
PER_INSTANCE_EXCLUDED_ITEM_IDS: dict[str, set[int]] = {{
    # "mc": {{12345}},  # Example: Tier 1 token, Molten Core only
}}


def is_item_excluded(item_id: int, instance_shortname: str) -> bool:
    """True if this item should be dropped from the scrape output for the
    given instance (checks both the global list and per-instance list).
    """
    if item_id in EXCLUDED_ITEM_IDS:
        return True
    instance_excluded = PER_INSTANCE_EXCLUDED_ITEM_IDS.get(instance_shortname, set())
    return item_id in instance_excluded
'''

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write(py_content)

print(f"Successfully generated '{OUTPUT_FILE}' with {len(extracted_items)} items!")