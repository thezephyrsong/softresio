"""
Parses AtlasLoot_Data["Key"] = { ... }; tables out of a WotLK AtlasLoot Lua
data file into plain Python structures:

    { "Sartharion": [ {"item_id": 40428, "percent": 18.0}, ... ], ... }

Only cares about item_id + drop percent (everything else, like item name/
quality/slot, is already sourced from items.json in the main scraper).
"""
import re

ROW_RE = re.compile(r'\{([^{}]*)\}')
PERCENT_RE = re.compile(r'^[0-9.]+%$')


def _split_row(row_text):
    """Split a Lua table row's inner text on top-level commas (ignores commas inside quotes)."""
    tokens = []
    current = []
    in_str = False
    for ch in row_text:
        if ch == '"':
            in_str = not in_str
            current.append(ch)
        elif ch == ',' and not in_str:
            tokens.append(''.join(current).strip())
            current = []
        else:
            current.append(ch)
    if current:
        tokens.append(''.join(current).strip())
    return tokens


def _parse_table_body(body_text):
    """Parses a table body into a flat item list, tagging each item with a
    cumulative "section" tier index. Section 0 is the base loot table;
    every time a `{ N, 0, "INV_Box_01", "=q6="..AL["Bonus Loot"], ... }`
    marker row is encountered, the section counter increments by 1 for all
    items that follow. This is how AtlasLoot encodes achievement-gated
    cumulative bonus loot within a single table - e.g. Sartharion's
    "X Drake(s) Left" bonus chest, Naxxramas's "Alone in the Darkness",
    and Trial of the Crusader's Tribute runs.
    """
    items = []
    section = 0
    for row_match in ROW_RE.finditer(body_text):
        row_text = row_match.group(1)
        tokens = _split_row(row_text)
        if len(tokens) < 2:
            continue
        try:
            item_id = int(tokens[1])
        except ValueError:
            continue
        if item_id == 0:
            # Header / class-divider / "Bonus Loot" marker row, not a real
            # item. If it's specifically a "Bonus Loot" tier marker, bump
            # the section counter so later items are tagged accordingly.
            if "Bonus Loot" in row_text:
                section += 1
            continue

        percent = None
        for tok in reversed(tokens):
            if len(tok) >= 2 and tok[0] == '"' and tok[-1] == '"':
                inner = tok[1:-1].strip()
                if PERCENT_RE.match(inner):
                    percent = float(inner.rstrip('%'))
                    break

        items.append({"item_id": item_id, "percent": percent, "section": section})
    return items


def parse_lua_loot_file(path):
    """Returns dict: { AtlasLoot_Data key -> [ {item_id, percent}, ... ] }"""
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        text = f.read()

    tables = {}
    for m in re.finditer(r'AtlasLoot_Data\["([^"]+)"\]\s*=\s*\{', text):
        key = m.group(1)
        start = m.end() - 1  # position of the opening '{'
        depth = 0
        end = -1
        for i in range(start, len(text)):
            c = text[i]
            if c == '{':
                depth += 1
            elif c == '}':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        if end == -1:
            continue
        body = text[start + 1:end - 1]
        tables[key] = _parse_table_body(body)

    return tables


def filter_by_max_section(items, max_section):
    """Keeps only items whose cumulative "section" tier is <= max_section.
    Pass None (or omit the filter entirely) to keep every section, which
    preserves the historical, section-agnostic behavior."""
    if max_section is None:
        return items
    return [it for it in items if it.get("section", 0) <= max_section]


def merge_tables(tables, keys, max_section=None):
    """Combine item lists from multiple AtlasLoot keys (for bosses paginated
    across several tables, e.g. Naxx80Gluth1 + Naxx80Gluth2).

    If max_section is given, only items tagged with that section tier or
    lower are included - this is how cumulative achievement-gated bonus
    loot (e.g. Sartharion's "X Drake(s) Left") gets filtered down to just
    the tier(s) relevant for a specific boss variant."""
    merged = []
    for k in keys:
        items = tables.get(k, [])
        merged.extend(filter_by_max_section(items, max_section))
    return merged


if __name__ == "__main__":
    import sys
    import json as _json

    path = sys.argv[1] if len(sys.argv) > 1 else "wrathofthelichking.lua"
    tables = parse_lua_loot_file(path)
    print(f"Parsed {len(tables)} AtlasLoot tables")

    for test_key in ["Sartharion", "Sartharion25Man", "Malygos", "UlduarLeviathan", "Naxx80Patchwerk"]:
        if test_key in tables:
            print(f"\n{test_key} ({len(tables[test_key])} items):")
            for it in tables[test_key][:6]:
                print(" ", it)
