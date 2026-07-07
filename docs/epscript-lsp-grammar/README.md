# epScript grammar (vendored)

`epScriptLexer.g4` and `epScriptParser.g4` are the ANTLR4 grammar files from
[zuhanit/epscript-lsp](https://github.com/zuhanit/epscript-lsp)
(`packages/server/src/grammar/`), MIT licensed. That project is a VS Code /
Neovim Language Server for epScript (completion, hover, diagnostics,
euddb offset lookup) — installing it is a separate, optional step for
editing `.eps` files by hand in an editor; these two files are vendored
here purely as a precise reference for resolving syntax questions (exact
statement/expression grammar, operator precedence, valid literal forms)
faster and more reliably than trial-and-error compiling or relying on
prose in [[reference_scrmapdocs|docs/SCRMapDocs]] alone.

When the formal grammar and SCRMapDocs prose disagree, treat the grammar
as authoritative for *syntax* (what parses), and SCRMapDocs / eudplib
GitHub source as authoritative for *semantics* (what a construct does at
runtime) — the grammar doesn't encode eudplib's runtime behavior (e.g.
function-boundary boxing), only what the parser accepts.
