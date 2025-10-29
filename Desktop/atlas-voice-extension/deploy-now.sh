#!/bin/bash

# Master Deployment Script - Deploy Atlas Memory Updates
# Run this after making code changes

set -e

echo "═══════════════════════════════════════════"
echo "🚀 Deploying Atlas Memory Enhancement"
echo "═══════════════════════════════════════════"
echo ""

# Get script directory
cd "$(dirname "$0")"

# Step 1: Restart Server
echo "📡 [1/3] Restarting backend server..."
if pm2 list | grep -q "atlas-server"; then
    pm2 restart atlas-server --update-env > /dev/null 2>&1
    sleep 2
    echo "   ✅ Server restarted (PID: $(pm2 list | grep atlas-server | awk '{print $10}' | head -1))"
else
    echo "   ❌ Server not running!"
    echo "   Start with: cd dev/server && pm2 start ecosystem.config.cjs"
    exit 1
fi

# Check server health
if curl -s http://localhost:3030/health > /dev/null 2>&1; then
    echo "   ✅ Server healthy"
else
    echo "   ❌ Server not responding"
    exit 1
fi

echo ""

# Step 2: Reload Extension
echo "🔄 [2/3] Reloading Chrome extension..."
echo "   ⚠️  MANUAL STEP REQUIRED:"
echo ""
echo "   Go to: chrome://extensions/"
echo "   Find: 'Atlas Voice Panel'"
echo "   Click: The reload icon (🔄)"
echo ""
echo "   Or run: osascript reload-chrome-extension.scpt"
echo ""
read -p "   Press ENTER after reloading extension..."

echo ""

# Step 3: Test
echo "🧪 [3/3] Testing memory system..."
echo ""
echo "   Quick Test:"
echo "   1. Open Atlas"
echo "   2. Open Console (F12)"
echo "   3. Look for: '🆔 Using existing user ID: user_...'"
echo "   4. Look for: '📜 Loading recent conversation history...'"
echo ""
read -p "   Do you see these logs? (y/n): " logs_ok

if [[ "$logs_ok" != "y" && "$logs_ok" != "Y" ]]; then
    echo ""
    echo "   ❌ Logs not found. Troubleshooting:"
    echo "      • Hard refresh: Cmd+Shift+R"
    echo "      • Clear localStorage: localStorage.clear() + reload"
    echo "      • Check server logs: pm2 logs atlas-server"
    exit 1
fi

echo ""
echo "   Now test memory:"
echo "   1. Say: 'Remember my favorite color is purple'"
echo "   2. Close Atlas"
echo "   3. Reopen Atlas (wait 3 seconds)"
echo "   4. Say: 'What's my favorite color?'"
echo ""
read -p "   Did Atlas remember? (y/n): " memory_ok

echo ""

if [[ "$memory_ok" == "y" || "$memory_ok" == "Y" ]]; then
    echo "═══════════════════════════════════════════"
    echo "✅ DEPLOYMENT SUCCESSFUL!"
    echo "═══════════════════════════════════════════"
    echo ""
    echo "Atlas Memory Enhancement is now LIVE! 🎉"
    echo ""
    echo "What's working:"
    echo "  ✓ Persistent user ID"
    echo "  ✓ Conversation history loading"
    echo "  ✓ Cross-session memory"
    echo "  ✓ User-specific storage"
    echo ""
else
    echo "═══════════════════════════════════════════"
    echo "❌ MEMORY TEST FAILED"
    echo "═══════════════════════════════════════════"
    echo ""
    echo "Debug steps:"
    echo "1. Check browser console for errors"
    echo "2. Verify Memory System toggle is ON in settings"
    echo "3. Check server logs: pm2 logs atlas-server"
    echo "4. Verify user ID exists: localStorage.getItem('atlasVoice_userId')"
    echo ""
    exit 1
fi
