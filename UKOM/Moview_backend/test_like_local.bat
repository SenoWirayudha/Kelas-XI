@echo off
echo Testing Like API Endpoint on localhost
echo.

REM Clear existing like first
php test_like.php

echo.
echo Sending POST to toggle like...
curl -X POST "http://localhost:8000/api/v1/users/3/movies/8/like" -H "Content-Type: application/json"

echo.
echo.
echo Checking like status...
curl -X GET "http://localhost:8000/api/v1/users/3/movies/8/like"

echo.
echo.
echo Toggle again (unlike)...
curl -X POST "http://localhost:8000/api/v1/users/3/movies/8/like" -H "Content-Type: application/json"

echo.
pause
