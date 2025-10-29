#!/bin/bash

# Atlas Memory Enhancement - Deployment Script
# This script deploys the memory system changes

set -e

echo "🚀 Deploying Atlas Memory Enhancement..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Step 1: Restart Backend Server
echo "📡 Step 1: Restarting backend server..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "atlas-server"; then
        echo "   → Restarting PM2 process..."
        pm2 restart atlas-server --update-env
        echo -e "${GREEN}   ✓ Server restarted${NC}"
    else
        echo "   → Starting server with PM2..."
        cd dev/server
        pm2 start ecosystem.config.cjs --update-env
        cd ../..
        echo -e "${GREEN}   ✓ Server started${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠ PM2 not found. Starting server manually...${NC}"
    cd dev/server
    node server.js &
    SERVER_PID=$!
    cd ../..
    echo -e "${GREEN}   ✓ Server started (PID: $SERVER_PID)${NC}"
fi

# Wait for server to be ready
echo "   → Waiting for server to be ready..."
sleep 3

# Test server health
if curl -s http://localhost:3030/health > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Server is healthy${NC}"
else
    echo -e "${RED}   ✗ Server health check failed${NC}"
    exit 1
fi

echo ""

# Step 2: Build Extension (if needed)
echo "🔨 Step 2: Building extension..."
if [ -f "dev/scripts/build-extension.js" ]; then
    node dev/scripts/build-extension.js
    echo -e "${GREEN}   ✓ Extension built${NC}"
else
    echo -e "${YELLOW}   ⚠ Build script not found, skipping...${NC}"
fi

echo ""

# Step 3: Reload Chrome Extension
echo "🔄 Step 3: Reload Chrome Extension"
echo -e "${YELLOW}   ⚠ Manual step required:${NC}"
echo "   1. Open Chrome and go to: chrome://extensions/"
echo "   2. Find 'Atlas Voice Panel'"
echo "   3. Click the reload icon (🔄) or toggle off/on"
echo ""
echo "   Press ENTER when extension is reloaded..."
read -r

echo ""

# Step 4: Verify localStorage
echo "🔍 Step 4: Checking user ID setup..."
echo -e "${YELLOW}   ⚠ Manual verification required:${NC}"
echo "   1. Open Atlas extension"
echo "   2. Open Browser Console (F12)"
echo "   3. Look for log: '🆔 Using existing user ID: user_...'"
echo "   4. Type: localStorage.getItem('atlasVoice_userId')"
echo ""
echo "   Do you see a user ID? (y/n)"
read -r has_user_id

if [[ "$has_user_id" == "y" || "$has_user_id" == "Y" ]]; then
    echo -e "${GREEN}   ✓ User ID verified${NC}"
else
    echo -e "${RED}   ✗ User ID not found. Clear localStorage and reload:${NC}"
    echo "   localStorage.clear()"
    echo "   location.reload()"
    exit 1
fi

echo ""

# Step 5: Test Memory System
echo "🧪 Step 5: Testing Memory System..."
echo ""
echo "Quick Test Instructions:"
echo "1. Say to Atlas: 'Remember that my favorite color is blue'"
echo "2. Say: 'What's my favorite color?' (should say blue)"
echo "3. Close Atlas extension completely"
echo "4. Reopen Atlas extension"
echo "5. Wait 3 seconds for memory to load"
echo "6. Say: 'What's my favorite color?'"
echo ""
echo "Did Atlas remember your favorite color? (y/n)"
read -r memory_works

if [[ "$memory_works" == "y" || "$memory_works" == "Y" ]]; then
    echo -e "${GREEN}   ✓ Memory system working!${NC}"
else
    echo -e "${RED}   ✗ Memory system not working${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check browser console for errors"
    echo "2. Verify Memory System is enabled in settings"
    echo "3. Check server logs: pm2 logs atlas-server"
    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════${NC}"
echo ""
echo "Atlas Memory Enhancement is now active!"
echo ""
echo "What's working now:"
echo "  ✓ Persistent user ID system"
echo "  ✓ Conversation history loading"
echo "  ✓ Cross-session memory recall"
echo "  ✓ User-specific memory storage"
echo ""
echo "Useful commands:"
echo "  - Check logs: pm2 logs atlas-server"
echo "  - Restart server: pm2 restart atlas-server"
echo "  - Check user ID: localStorage.getItem('atlasVoice_userId')"
echo ""
