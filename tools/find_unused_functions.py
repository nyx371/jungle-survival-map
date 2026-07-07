#!/usr/bin/env python3
"""
Find epScript functions with zero call sites anywhere under a source tree.

Counts both bare calls (foo(...)) and qualified cross-module calls
(module.foo(...)) by searching for `\bNAME(` across the whole corpus and
excluding the `function NAME(` definition line itself. This replaces an
earlier ad hoc regex that used a negative lookbehind for "." and wrongly
excluded legitimate `module.func(` call sites.

Usage:
    python tools/find_unused_functions.py [root]   (default root: src)

A function showing up here isn't necessarily dead: it may be intentionally
unused API surface, or blocked on missing input-detection infrastructure.
Treat this as a starting point for review, not an automatic delete list.
"""
import re
import sys
from pathlib import Path


def main():
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("src")
    files = sorted(p for p in root.rglob("*.eps") if "__epspy__" not in p.parts)

    texts = {f: f.read_text(encoding="utf-8") for f in files}
    corpus = "\n".join(texts.values())

    def_re = re.compile(r"^function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(", re.MULTILINE)

    defs = []
    for f, text in texts.items():
        for m in def_re.finditer(text):
            line = text.count("\n", 0, m.start()) + 1
            defs.append((m.group(1), f, line))

    unused = []
    for name, f, line in defs:
        call_re = re.compile(r"(?<!function )\b" + re.escape(name) + r"\s*\(")
        if len(call_re.findall(corpus)) == 0:
            unused.append((name, f, line))

    for name, f, line in unused:
        print(f"{name} (defined in {f}:{line})")

    print(f"\n{len(unused)} unused / {len(defs)} total functions")


if __name__ == "__main__":
    main()
