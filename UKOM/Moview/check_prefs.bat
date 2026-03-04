@echo off
echo === Checking SharedPreferences for user_id ===
echo.
adb shell "run-as com.komputerkit.moview cat /data/data/com.komputerkit.moview/shared_prefs/MoviewPrefs.xml"
echo.
echo === Done ===
pause
