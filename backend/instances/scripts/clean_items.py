import json
import shutil
from pathlib import Path

ITEMS_FILE = "items.json"
BACKUP_FILE = "items.json.bak"

def clean_field_value(val):
    """Recursively converts dicts or lists into clean strings."""
    if isinstance(val, dict):
        # Look for common language/name keys or fall back to the first dict value
        return (
            val.get("name") 
            or val.get("en") 
            or val.get("label") 
            or (str(next(iter(val.values()))) if val else "")
        )
    elif isinstance(val, list):
        if len(val) > 0:
            return clean_field_value(val[0])
        return ""
    return val

def clean_items_json():
    file_path = Path(ITEMS_FILE)
    if not file_path.exists():
        print(f"Error: Could not find {ITEMS_FILE}")
        return

    # 1. Create a safety backup
    shutil.copy(file_path, BACKUP_FILE)
    print(f"Created safety backup at: {BACKUP_FILE}")

    # 2. Load JSON data
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    cleaned_entries = 0

    # 3. Handle both list-based and dictionary-based JSON structures
    if isinstance(data, dict):
        items_iterator = data.values()
    elif isinstance(data, list):
        items_iterator = data
    else:
        print("Error: JSON root is neither a dict nor a list.")
        return

    # 4. Clean each item
    for item in items_iterator:
        if not isinstance(item, dict):
            continue

        # Target fields that often have unexpected dict/nested structures
        target_fields = ["slot", "inventoryType", "slot_raw", "name", "icon"]

        for field in target_fields:
            if field in item and isinstance(item[field], (dict, list)):
                original = item[field]
                item[field] = clean_field_value(original)
                cleaned_entries += 1

    # 5. Overwrite items.json with cleaned data
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Cleanup finished successfully! Fixed {cleaned_entries} nested field issues.")

if __name__ == "__main__":
    clean_items_json()