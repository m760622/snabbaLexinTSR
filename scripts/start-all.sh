#!/bin/bash

echo "🚀 Starting SnabbaLexin with Global Access..."

# Start Nginx
echo "📡 Setting up Nginx on Port 80..."
./scripts/setup-nginx.sh

# Start Vite in background
echo "⚡ Starting Vite dev server..."
vite --port 8080 --host &
VITE_PID=$!

# Wait for Vite to start
sleep 3

# Start Cloudflare Tunnel
echo "🌍 Creating global tunnel..."
cloudflared tunnel --url http://localhost:80 &
TUNNEL_PID=$!

echo ""
echo "✅ All services started!"
echo "📍 Local: http://localhost"
echo "🌍 Global: Check terminal output above for Cloudflare URL"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C to cleanup
trap "echo '🛑 Stopping services...'; kill $VITE_PID $TUNNEL_PID 2>/dev/null; sudo nginx -s stop 2>/dev/null; exit" INT

# Wait for processes
wait
