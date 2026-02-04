@echo off
echo Testing Like API Endpoint
echo.

REM Unlike first (if already liked)
echo Sending POST to toggle like...
curl -X POST "http://10.0.2.2:8000/api/v1/users/3/movies/8/like" -H "Content-Type: application/json"

echo.
echo.
echo Checking like status...
curl -X GET "http://10.0.2.2:8000/api/v1/users/3/movies/8/like"

echo.
pause
