@echo off
echo === Testing Login API ===
echo.

echo 1. Testing valid login:
curl -X POST http://localhost:8000/api/v1/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"user@moview.com\",\"password\":\"password123\"}"

echo.
echo.
echo 2. Testing invalid password:
curl -X POST http://localhost:8000/api/v1/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"user@moview.com\",\"password\":\"wrongpassword\"}"

echo.
echo.
echo 3. Testing non-existent user:
curl -X POST http://localhost:8000/api/v1/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"notexist@moview.com\",\"password\":\"password123\"}"

echo.
