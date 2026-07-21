#!/usr/bin/env sh
# Deploy/update satu environment. Jalankan DI DALAM folder env (wellness-dev / wellness-prod).
# Tiap folder punya .env sendiri (COMPOSE_PROJECT_NAME + WEB_PORT beda) -> volume terpisah.
# Update ini TIDAK menghapus data (volume pgdata aman; hanya `down -v` yang menghapus).
set -e

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "ERROR: .env tidak ada. Jalankan: cp .env.example .env lalu isi." >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
PROJECT="$(grep -E '^COMPOSE_PROJECT_NAME=' .env | cut -d= -f2)"
PORT="$(grep -E '^WEB_PORT=' .env | cut -d= -f2)"
PORT="${PORT:-3000}"

echo ">> env: ${PROJECT:-<default>}  branch: ${BRANCH}  port: ${PORT}"
echo ">> git pull (${BRANCH})..."
git pull --ff-only

echo ">> build & up..."
docker compose up -d --build

echo ">> status:"
docker compose ps
echo ">> selesai. Buka http://localhost:${PORT}"
