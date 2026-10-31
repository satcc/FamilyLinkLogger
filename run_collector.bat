@echo off
cd /d "%~dp0"
echo [%date% %time%] Starting Family Link Collector...
set PYTHONIOENCODING=utf-8
call .venv\Scripts\python.exe scraper\collector.py
echo [%date% %time%] Finished.
