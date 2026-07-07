# Dev tools

Small scripts that make editing `.eps` sources faster. `.eps` files are
misdetected as binary by generic editor tooling (PostScript extension
collision), so edits go through these instead of a normal editor.

## `eps_patch.py`

Safe find/replace for `.eps` files with correct UTF-8 + CRLF handling baked
in (get either wrong and the file silently corrupts). Takes a JSON edit (or
list of edits) on stdin; aborts with no changes written if an `old` string
isn't found or occurs a different number of times than expected.

```sh
python tools/eps_patch.py src/systems/foo.eps <<'JSON'
{"old": "...", "new": "..."}
JSON
```

Multiple edits, or a replace-all (`"count": -1`):

```sh
python tools/eps_patch.py src/systems/foo.eps <<'JSON'
[
  {"old": "...", "new": "...", "count": 2},
  {"old": "...", "new": "...", "count": -1}
]
JSON
```

Always use a **quoted** heredoc delimiter (`<<'JSON'`, not `<<JSON`) so the
shell doesn't try to expand `$L(...)`, `$U(...)`, etc. found in epScript
source.

To read a file, plain `grep -n "" path/to/file.eps` works fine and is
already CRLF/UTF-8 safe (read-only).

## `find_unused_functions.py`

Scans a source tree (default `src`) for functions with zero call sites,
counting both bare (`foo(`) and qualified (`module.foo(`) calls.

```sh
python tools/find_unused_functions.py
```

Ignore `onPluginStart`/`beforeTriggerExec`/`afterTriggerExec` in the
output — those are euddraft's own plugin entry points, called by the
framework rather than from our source. Everything else is a real
candidate for review, not an automatic delete list — some things are
intentionally unused API surface or blocked on missing infrastructure
(see project memory / recent commit history for context).

## `check-syntax.sh`

Bash-callable equivalent of `check-syntax.bat` (which needs PowerShell/cmd).
Copies `jc_source.scx` to `dist/jc_source_check.scx` and compiles via
euddraft — never touches the live map.

```sh
bash tools/check-syntax.sh
```
