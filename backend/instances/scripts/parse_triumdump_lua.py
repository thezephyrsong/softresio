"""
Parses TriumDumpDB-style Lua dumps: a big array where the array INDEX is the
item ID and each entry is a list of raw tooltip lines exactly as captured
in-game (e.g. via GameTooltip:SetHyperlink + reading each line's text).

This is the best source for things itemcache.wdb structurally can't give
you - Binds/Unique text, and especially "Equip:"/"Use:"/"Chance on hit:"
lines, since those come from the spell's own tooltip text, not the item
record.

Returns: { item_id: [line1, line2, ...] } - only for entries that have real
data (skips "Retrieving item information" placeholders).
"""
import re

ENTRY_RE = re.compile(r'\{(.*?)\}, -- \[(\d+)\]', re.DOTALL)
LINE_RE = re.compile(r'"((?:[^"\\]|\\.)*)"')


def _unescape(s):
    return s.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')


def parse_triumdump_lua(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        text = f.read()

    items = {}
    for entry_match in ENTRY_RE.finditer(text):
        body, idx_str = entry_match.group(1), entry_match.group(2)
        item_id = int(idx_str)

        lines = []
        for line_match in LINE_RE.finditer(body):
            raw = _unescape(line_match.group(1))
            # A single captured tooltip line can itself contain embedded
            # newlines (e.g. multi-requirement socket bonus text) - split
            # those into separate logical lines.
            for sub_line in raw.split('\n'):
                sub_line = sub_line.strip()
                if sub_line:
                    lines.append(sub_line)

        if lines and lines[0] != "Retrieving item information":
            items[item_id] = lines

    return items


if __name__ == "__main__":
    import sys
    import json as _json

    path = sys.argv[1] if len(sys.argv) > 1 else "TriumDump.lua"
    items = parse_triumdump_lua(path)
    print(f"Parsed {len(items)} real items (out of however many total entries)")

    for test_id in [60, 61, 17, 25]:
        if test_id in items:
            print(f"\n[{test_id}]:", items[test_id])
