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
    items = []
    for row_match in ROW_RE.finditer(body_text):
        tokens = _split_row(row_match.group(1))
        if len(tokens) < 2:
            continue
        try:
            item_id = int(tokens[1])
        except ValueError:
            continue
        if item_id == 0:
            # Header / class-divider / "Bonus Loot" marker row, not a real item
            continue

        percent = None
        for tok in reversed(tokens):
            if len(tok) >= 2 and tok[0] == '"' and tok[-1] == '"':
                inner = tok[1:-1].strip()
                if PERCENT_RE.match(inner):
                    percent = float(inner.rstrip('%'))
                    break

        items.append({"item_id": item_id, "percent": percent})
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


def merge_tables(tables, keys):
    """Combine item lists from multiple AtlasLoot keys (for bosses paginated
    across several tables, e.g. Naxx80Gluth1 + Naxx80Gluth2)."""
    merged = []
    for k in keys:
        merged.extend(tables.get(k, []))
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
