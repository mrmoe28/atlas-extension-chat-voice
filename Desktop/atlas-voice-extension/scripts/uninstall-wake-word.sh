#!/bin/bash

# Uninstall Atlas Wake Word Service

set -e

echo "🗑️  Uninstalling Atlas Wake Word Service..."
echo ""

PLIST_FILE="$HOME/Library/LaunchAgents/com.atlas.wake-word.plist"

if [ -f "$PLIST_FILE" ]; then
    echo "Stopping service..."
    launchctl unload "$PLIST_FILE" 2>/dev/null || true

    echo "Removing LaunchAgent..."
    rm "$PLIST_FILE"

    echo "✅ Atlas Wake Word service uninstalled"
    echo ""
    echo "Logs preserved at:"
    echo "  ~/Library/Logs/atlas-wake-word.log"
    echo "  ~/Library/Logs/atlas-wake-word-error.log"
else
    echo "Service not found (already uninstalled)"
fi

echo ""
echo "Done!"
