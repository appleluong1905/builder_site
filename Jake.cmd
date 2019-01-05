@echo off

if exist node_modules/.bin/jake goto :run_jake

echo Building npm modules:
call npm rebuild

:run_jake
node_modules/.bin/jake %*