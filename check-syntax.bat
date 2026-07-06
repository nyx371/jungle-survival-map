@echo off
setlocal
pushd "%~dp0"

if not exist "dist" mkdir "dist"
copy /Y "jc_source.scx" "dist\jc_source_check.scx" >nul

"C:\Users\kalle\Documents\StarCraft\Maps\SC\euddraft0.9.10.9\euddraft.exe" jc.eds

popd
endlocal
