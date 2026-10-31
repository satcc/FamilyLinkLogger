:echo off
title FamilyLinkLogger
cd /d %~dp0
.venv\Scripts\python.exe scraper\collector.py --loop