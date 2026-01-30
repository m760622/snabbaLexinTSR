#!/bin/bash

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx is not installed. Please wait for installation to complete."
    exit 1
fi

echo "🔄 Stopping any running Nginx..."
sudo nginx -s stop 2>/dev/null

echo "🚀 Starting Nginx Proxy on Port 80..."
# Start Nginx with local config using absolute path
CONF_PATH="$(pwd)/nginx-local.conf"
sudo nginx -c "$CONF_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Nginx is running!"
    echo "🌍 You can now access: http://localhost"
    echo "📡 Share with LAN devices: http://$(ipconfig getifaddr en0)"
else
    echo "❌ Failed to start Nginx."
    exit 1
fi
