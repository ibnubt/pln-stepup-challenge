#!/usr/bin/env bash
# ============================================================================
# Backup DB "wellness" -> backups/wellness_YYYYMMDD_HHMMSS.sql.gz (simpan 30 terbaru)
# Pakai: bash scripts/backup-db.sh   (atau jadwalkan via cron)
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
STAMP=$(date +%Y%m%d_%H%M%S)
OUT="backups/wellness_${STAMP}.sql.gz"

echo "[backup] pg_dump -> $OUT"
docker compose exec -T db pg_dump -U postgres -d wellness | gzip -c > "$OUT"

# retensi: simpan 30 file terbaru, hapus sisanya
ls -1t backups/wellness_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm -f
echo "[backup] selesai: $OUT ($(du -h "$OUT" | cut -f1))"
