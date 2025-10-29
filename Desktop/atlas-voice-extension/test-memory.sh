#!/bin/bash

# Atlas Memory Test Script
# Tests if memory system is working

echo "🧪 Atlas Memory System Test"
echo ""

# Check if server is running
if ! curl -s http://localhost:3030/health > /dev/null 2>&1; then
    echo "❌ Server not responding on port 3030"
    echo "Start server: pm2 start dev/server/ecosystem.config.cjs"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Instructions
echo "📋 Follow these steps to test memory:"
echo ""
echo "TEST 1: Basic Memory (Same Session)"
echo "  1. Open Atlas extension"
echo "  2. Say: 'Remember my name is [YOUR NAME]'"
echo "  3. Say: 'What's my name?'"
echo "  4. ✅ Should respond with your name"
echo ""

echo "TEST 2: Cross-Session Memory"
echo "  5. Close Atlas completely"
echo "  6. Reopen Atlas"
echo "  7. Wait 3 seconds"
echo "  8. Say: 'What's my name?'"
echo "  9. ✅ Should remember from previous session!"
echo ""

echo "📊 Check Browser Console (F12) for:"
echo "  🆔 Using existing user ID: user_..."
echo "  📜 Loading recent conversation history..."
echo "  ✅ Loaded X messages from conversation history"
echo ""

echo "🔍 Verify User ID:"
echo "  Open console and type:"
echo "  localStorage.getItem('atlasVoice_userId')"
echo ""
