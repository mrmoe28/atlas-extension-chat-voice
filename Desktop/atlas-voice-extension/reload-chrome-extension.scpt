-- Auto-reload Chrome Extension (Atlas Voice Panel)
-- This AppleScript opens Chrome extensions page and simulates reload

tell application "Google Chrome"
    activate

    -- Open or switch to extensions page
    set extensionsURL to "chrome://extensions/"
    set foundTab to false

    repeat with w in windows
        repeat with t in tabs of w
            if URL of t starts with extensionsURL then
                set active tab index of w to index of t
                set foundTab to true
                exit repeat
            end if
        end repeat
        if foundTab then exit repeat
    end repeat

    if not foundTab then
        open location extensionsURL
    end if

    delay 1

    -- Display message
    display dialog "Chrome extensions page opened.

To reload Atlas Voice Panel:
1. Find 'Atlas Voice Panel' in the list
2. Click the reload icon (🔄)
3. Close this dialog when done" buttons {"Done"} default button "Done" with title "Reload Atlas Extension"

end tell
