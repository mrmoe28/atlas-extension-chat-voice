#!/bin/bash

# Atlas Wake Word Installation Script
# Sets up automatic "Hey Atlas" detection on macOS login

set -e

echo "🚀 Installing Atlas Wake Word Service..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}📁 Project directory: $PROJECT_DIR${NC}"
echo ""

# Step 1: Install Python dependencies
echo -e "${YELLOW}Step 1: Installing Python dependencies...${NC}"
pip3 install SpeechRecognition pyaudio 2>/dev/null || {
    echo "Installing via homebrew..."
    brew install portaudio
    pip3 install SpeechRecognition pyaudio
}
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Step 2: Make Python script executable
echo -e "${YELLOW}Step 2: Making wake word script executable...${NC}"
chmod +x "$SCRIPT_DIR/atlas-wake-word.py"
echo -e "${GREEN}✅ Script is executable${NC}"
echo ""

# Step 3: Create LaunchAgent plist
echo -e "${YELLOW}Step 3: Creating LaunchAgent configuration...${NC}"

PLIST_FILE="$HOME/Library/LaunchAgents/com.atlas.wake-word.plist"

cat > "$PLIST_FILE" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.atlas.wake-word</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/python3</string>
        <string>$SCRIPT_DIR/atlas-wake-word.py</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/atlas-wake-word.log</string>

    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/atlas-wake-word-error.log</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
EOF

echo -e "${GREEN}✅ LaunchAgent created at: $PLIST_FILE${NC}"
echo ""

# Step 4: Load the service
echo -e "${YELLOW}Step 4: Loading LaunchAgent...${NC}"
launchctl unload "$PLIST_FILE" 2>/dev/null || true
launchctl load "$PLIST_FILE"
echo -e "${GREEN}✅ Service loaded and running${NC}"
echo ""

# Step 5: Enable auto-connect in Atlas settings
echo -e "${YELLOW}Step 5: Enabling auto-connect in Atlas...${NC}"
# This will be handled by user in extension settings
echo -e "${BLUE}ℹ️  Please enable 'Auto-connect on startup' in Atlas settings${NC}"
echo ""

echo "=" | tr '=' '='
echo "=" | tr '=' '='
echo ""
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo ""
echo -e "${BLUE}Atlas Wake Word is now active!${NC}"
echo ""
echo "How it works:"
echo "  1. The service runs in the background on login"
echo "  2. Say 'Hey Atlas' anytime to open Chrome + Atlas"
echo "  3. Atlas will auto-connect if you enabled it in settings"
echo ""
echo "Commands:"
echo "  • Check status:  launchctl list | grep atlas"
echo "  • View logs:     tail -f ~/Library/Logs/atlas-wake-word.log"
echo "  • Stop service:  launchctl unload $PLIST_FILE"
echo "  • Start service: launchctl load $PLIST_FILE"
echo ""
echo -e "${YELLOW}💡 Test it now: Say 'Hey Atlas' and watch Chrome open!${NC}"
echo ""
