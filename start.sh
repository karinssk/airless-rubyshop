#!/bin/bash

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting MongoDB (Docker)..."
docker compose -f "$ROOT/docker-compose.yml" up -d

echo "Starting Backend..."
cd "$ROOT/backend" && npm run dev &
BACKEND_PID=$!

echo "Starting Frontend (port 5001)..."
cd "$ROOT/frontend" && npm run dev &
FRONTEND_PID=$!

echo "Starting Admin (port 5002)..."
cd "$ROOT/admin" && npm run dev &
ADMIN_PID=$!

echo ""
echo "All services started:"
echo "  Backend  → http://localhost:3000"
echo "  Frontend → http://localhost:5001"
echo "  Admin    → http://localhost:5002"
echo ""
echo "Press Ctrl+C to stop all services."

trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID $ADMIN_PID 2>/dev/null; docker compose -f '$ROOT/docker-compose.yml' stop; exit 0" SIGINT SIGTERM

wait
