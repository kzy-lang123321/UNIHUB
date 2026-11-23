@echo off
echo ========================================================
echo   UniHub - Upload AAB to Google Play Store via CMD
echo ========================================================
echo.
set PYTHON="D:\unihub\.venv-play\Scripts\python.exe"
%PYTHON% "D:\unihub\scripts\upload-aab-playstore.py"
echo.
pause
