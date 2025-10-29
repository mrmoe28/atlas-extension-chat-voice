#!/bin/bash

# Quick Atlas Reload Script
# Restarts server and shows extension reload instructions

echo "🔄 Reloading Atlas..."

# Restart server
if pm2 list | grep -q "atlas-server"; then
    echo "📡 Restarting server..."
    pm2 restart atlas-server --update-env
    sleep 2
    echo "✅ Server restarted"
else
    echo "❌ Server not running. Start with: pm2 start dev/server/ecosystem.config.cjs"
    exit 1
fi

# Open Chrome extensions page
echo "🌐 Opening Chrome extensions page..."
open "chrome://extensions/" 2>/dev/null || echo "Open chrome://extensions/ manually"

echo ""
echo "📋 To complete reload:"
echo "1. In Chrome extensions page, find 'Atlas Voice Panel'"
echo "2. Click the reload icon (🔄)"
echo "3. Open Atlas and test"
echo ""
echo "✅ Server is ready!"
