#!/bin/bash

# Verify Atlas Memory System is Working

echo "🔍 Verifying Atlas Memory System..."
echo ""

# Check server
echo "1️⃣ Checking server..."
if curl -s http://localhost:3030/health > /dev/null 2>&1; then
    echo "   ✅ Server running on port 3030"
else
    echo "   ❌ Server not responding"
    exit 1
fi

echo ""
echo "2️⃣ Next steps:"
echo ""
echo "   📱 Open Atlas Voice Panel extension"
echo "   🔍 Open Browser Console (F12 or Cmd+Option+I)"
echo ""
echo "   Look for these logs in console:"
echo "   ─────────────────────────────────"
echo "   🆔 Using existing user ID: user_..."
echo "   🚀 Atlas initialized with User ID: user_..."
echo "   🧠 Loading full memory context..."
echo "   📜 Loading recent conversation history..."
echo "   ✅ Loaded X messages from conversation history"
echo "   ─────────────────────────────────"
echo ""
echo "   ✅ If you see these = Memory system is ACTIVE!"
echo "   ❌ If not, check for errors in red"
echo ""
echo "3️⃣ Test memory:"
echo ""
echo "   Say: 'Remember my name is [YOUR NAME]'"
echo "   Then close Atlas and reopen"
echo "   Say: 'What's my name?'"
echo "   ✅ Should remember it!"
echo ""
