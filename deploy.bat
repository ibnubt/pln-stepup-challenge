@echo off
REM Deploy/update satu environment (Windows). Jalankan DI DALAM folder env (wellness-dev / wellness-prod).
REM Tiap folder punya .env sendiri (COMPOSE_PROJECT_NAME + WEB_PORT beda) -> volume terpisah.
REM Update ini TIDAK menghapus data (volume pgdata aman; hanya "down -v" yang menghapus).
setlocal enabledelayedexpansion
cd /d "%~dp0"

if not exist ".env" (
  echo ERROR: .env tidak ada. Jalankan: copy .env.example .env  lalu isi.
  exit /b 1
)

set "PROJECT="
set "PORT="
for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"COMPOSE_PROJECT_NAME=" .env`) do set "PROJECT=%%B"
for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b /c:"WEB_PORT=" .env`) do set "PORT=%%B"
REM buang komentar/spasi di belakang nilai
for /f "tokens=1" %%P in ("%PROJECT%") do set "PROJECT=%%P"
for /f "tokens=1" %%P in ("%PORT%") do set "PORT=%%P"
if "%PORT%"=="" set "PORT=3000"

echo ^>^> env: %PROJECT%   port: %PORT%
echo ^>^> git pull...
git pull --ff-only

echo ^>^> build ^& up...
docker compose up -d --build

echo ^>^> status:
docker compose ps
echo ^>^> selesai. Buka http://localhost:%PORT%
endlocal
