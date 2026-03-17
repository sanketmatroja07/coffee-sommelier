#!/bin/bash
# Start full Coffee Finder stack: Docker (db + api) + seed + consumer
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Coffee Finder — starting dev stack"
echo ""

# Check Docker
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

# Start db + api
echo "Starting PostgreSQL and API..."
cd "$ROOT"
docker compose up -d db api

# Wait for API health
echo "Waiting for API to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "API is ready."
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ API did not become ready. Check logs: docker compose logs api"
    exit 1
  fi
  sleep 2
done

# Seed database (run inside API container so it can reach db)
echo "Seeding database..."
(cd "$ROOT" && docker compose exec -T api python -m scripts.seed) || true

echo ""
echo "✅ Backend running at http://localhost:8000"
echo ""
echo "Starting consumer (Ctrl+C to stop)..."
cd "$ROOT/consumer"
npm run dev
