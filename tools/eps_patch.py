#!/usr/bin/env python3
"""
Safe find/replace editor for .eps files.

The Read/Edit tools misdetect .eps as a binary format (PostScript
extension collision), and hand-writing CRLF/UTF-8 correctly every time is
easy to get wrong. This script is the one place that encoding logic lives.

Usage:
    python tools/eps_patch.py <file> <<'JSON'
    {"old": "...", "new": "..."}
    JSON

    python tools/eps_patch.py <file> <<'JSON'
    [
        {"old": "...", "new": "...", "count": 2},
        {"old": "...", "new": "..."}
    ]
    JSON

Each edit's "old" string must appear in the file exactly `count` times
(default 1) or the script aborts with no changes written. Use count: -1 to
allow (and replace) any number of occurrences (replace_all).

Always use a *quoted* heredoc delimiter (<<'JSON') so the shell does not
try to expand $L(...), $U(...), etc. found in epScript source.
"""
import json
import sys


def main():
    if len(sys.argv) != 2:
        print("usage: eps_patch.py <file>  (edits as JSON on stdin)", file=sys.stderr)
        sys.exit(2)

    path = sys.argv[1]
    spec = json.load(sys.stdin)
    edits = spec if isinstance(spec, list) else [spec]

    with open(path, encoding="utf-8") as f:
        data = f.read()

    for i, edit in enumerate(edits):
        old, new = edit["old"], edit["new"]
        expected = edit.get("count", 1)
        actual = data.count(old)
        if actual == 0:
            print(f"edit {i}: old string not found:\n{old!r}", file=sys.stderr)
            sys.exit(1)
        if expected != -1 and actual != expected:
            print(
                f"edit {i}: expected {expected} occurrence(s), found {actual}:\n{old!r}",
                file=sys.stderr,
            )
            sys.exit(1)
        data = data.replace(old, new)

    with open(path, "w", encoding="utf-8", newline="\r\n") as f:
        f.write(data)

    print(f"OK: applied {len(edits)} edit(s) to {path}")


if __name__ == "__main__":
    main()
