#!/bin/bash
cd "$(dirname "$0")"

trap 'kill 0; exit' INT TERM

echo "Starting backend..."
cd backend
uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 8000 --ws wsproto &

echo "Starting frontend..."
cd ../frontend
npm run dev &

echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both."
echo ""

wait
