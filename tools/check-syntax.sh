#!/usr/bin/env bash
# Bash-callable equivalent of check-syntax.bat, for use from the Bash tool
# without switching to PowerShell. Never touches the live map.
set -e
cd "$(git rev-parse --show-toplevel)"

mkdir -p dist
cp -f jc_source.scx dist/jc_source_check.scx

EUDDRAFT="C:\\Users\\kalle\\Documents\\StarCraft\\Maps\\SC\\euddraft0.9.10.9\\euddraft.exe"
"$EUDDRAFT" jc.eds
