@echo off
REM Static domain - tetap, tidak akan ganti tiap run (Free plan)
REM Domain ID: rd_3JlKeZ07NgH7ngXV0TMtSSWIaYM
REM Kalau ngrok mati/hidup lagi URL tetap sama, tidak perlu ganti local.properties/.env lagi

echo Starting Laravel + ngrok (static domain)...
echo Domain: https://genetics-stiffness-repaint.ngrok-free.dev
echo ID: rd_3JlKeZ07NgH7ngXV0TMtSSWIaYM
echo.

REM Jalankan ngrok dengan static domain
ngrok http --domain=genetics-stiffness-repaint.ngrok-free.dev 8000
