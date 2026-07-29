"""
Item IDs to drop from the scraped output entirely, regardless of which boss
or instance they came from. This runs *before* an item is ever written to
the instance JSON, so excluded items never show up in SR pickers, HR
pickers, or the loot browser for anyone - it's not a per-raid choice (see
`excludedBossIds` on the Raid type for that), it's "this item shouldn't be
tracked by the tool at all".

Typical uses: tier-set tokens your guild distributes outside of SR (loot
council, guaranteed-per-player systems, etc), profession recipe/formula
"spellbook" drops nobody actually soft-reserves, or any other loot that's
just noise in the picker.

--------------------------------------------------------------------------
HOW TO ADD IDS
--------------------------------------------------------------------------
- Global (hidden everywhere, in every instance): add to EXCLUDED_ITEM_IDS.
- Scoped to one instance only (same item ID still shows up elsewhere): add
  to PER_INSTANCE_EXCLUDED_ITEM_IDS, keyed by the instance's `shortname`
  (e.g. "mc", "os10", "os25", "aq20", "aq40").

Comment each entry with the item name so this stays readable as it grows -
`python3 -c "import json; d=json.load(open('items.json')); print([i['name'] for i in d if i['id']==ITEM_ID])"`
against your local items.json, or check a freshly-generated
../triumvirate/<shortname>.json, are both easy ways to confirm an ID before
adding it here.
--------------------------------------------------------------------------
"""

# Hidden from every instance, no matter where they drop.
EXCLUDED_ITEM_IDS: set[int] = set([
    # Example (not currently enabled - uncomment/replace with real IDs):
    # 12345,  # Formula: Enchant Weapon - Whatever
])

# Hidden only within the listed instance(s) - the same item ID is still
# shown normally if it drops somewhere else.
PER_INSTANCE_EXCLUDED_ITEM_IDS: dict[str, set[int]] = {
    # "mc": {12345},  # Example: Tier 1 token, Molten Core only
}


def is_item_excluded(item_id: int, instance_shortname: str) -> bool:
    """True if this item should be dropped from the scrape output for the
    given instance (checks both the global list and the per-instance one)."""
    if item_id in EXCLUDED_ITEM_IDS:
        return True
    if item_id in PER_INSTANCE_EXCLUDED_ITEM_IDS.get(instance_shortname, ()):
        return True
    return False
