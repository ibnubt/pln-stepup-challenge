@echo off
REM ============================================================================
REM Backup DB "wellness" -> backups\wellness_YYYYMMDD_HHMMSS.sql (retensi 30 hari)
REM Jalankan dari folder repo, atau jadwalkan via Task Scheduler (lihat README).
REM ============================================================================
setlocal
cd /d "%~dp0.."
if not exist backups mkdir backups

for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set STAMP=%%i
set OUT=backups\wellness_%STAMP%.sql

echo [backup] pg_dump -^> %OUT%
docker compose exec -T db pg_dump -U postgres -d wellness > "%OUT%"
if errorlevel 1 (
  echo [backup] GAGAL - pastikan container db hidup.
  del "%OUT%" 2>nul
  exit /b 1
)

REM retensi: hapus backup lebih tua dari 30 hari
forfiles /p "backups" /m "wellness_*.sql" /d -30 /c "cmd /c del @path" 2>nul
echo [backup] selesai: %OUT%
endlocal
