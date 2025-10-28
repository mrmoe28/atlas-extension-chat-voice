# Atlas Voice Agent - Comprehensive Command List

## Current Commands ✅
- `OPEN_FOLDER` - Open folder (Downloads, Desktop, etc.)
- `CREATE_FILE` - Create text file
- `CREATE_FOLDER` - Create directory
- `LAUNCH_APP` - Launch applications
- `OPEN_URL` - Navigate to websites
- `CLICK_ELEMENT` - Click page elements
- `TYPE_TEXT` - Type into input fields
- `SCROLL_PAGE` - Scroll page (up/down/left/right/top/bottom)
- `MOUSE_CLICK` - Smart click (text or coordinates)
- `MOUSE_MOVE` - Move mouse to coordinates

## Suggested Additional Commands 🚀

### 📁 File & Folder Management
- `DELETE_FILE` - Delete files
- `DELETE_FOLDER` - Delete folders
- `RENAME_FILE` - Rename files/folders
- `COPY_FILE` - Copy files/folders
- `MOVE_FILE` - Move files/folders
- `LIST_FILES` - List directory contents
- `FIND_FILE` - Search for files
- `OPEN_FILE` - Open files with default app
- `ZIP_FOLDER` - Create zip archives
- `UNZIP_FILE` - Extract zip files

### 🌐 Browser Automation
- `REFRESH_PAGE` - Reload current page
- `GO_BACK` - Browser back button
- `GO_FORWARD` - Browser forward button
- `CLOSE_TAB` - Close current tab
- `NEW_TAB` - Open new tab
- `SWITCH_TAB` - Switch between tabs
- `BOOKMARK_PAGE` - Add bookmark
- `DOWNLOAD_FILE` - Download current file
- `FILL_FORM` - Fill multiple form fields
- `SELECT_DROPDOWN` - Select dropdown options
- `CHECK_CHECKBOX` - Check/uncheck boxes
- `UPLOAD_FILE` - Upload files
- `TAKE_SCREENSHOT` - Capture page screenshot
- `GET_PAGE_TITLE` - Get page title
- `GET_PAGE_URL` - Get current URL

### 🖱️ Advanced Mouse & Keyboard
- `DOUBLE_CLICK` - Double-click element
- `RIGHT_CLICK` - Right-click element
- `DRAG_DROP` - Drag and drop elements
- `HOVER_ELEMENT` - Hover over element
- `KEY_PRESS` - Press specific keys (Enter, Tab, Escape, etc.)
- `KEY_COMBINATION` - Press key combinations (Ctrl+C, Alt+Tab, etc.)
- `PASTE_TEXT` - Paste from clipboard
- `COPY_TEXT` - Copy text to clipboard
- `SELECT_ALL` - Select all text
- `CLEAR_FIELD` - Clear input field

### 📱 System Control
- `VOLUME_UP` - Increase system volume
- `VOLUME_DOWN` - Decrease system volume
- `MUTE_VOLUME` - Toggle mute
- `BRIGHTNESS_UP` - Increase screen brightness
- `BRIGHTNESS_DOWN` - Decrease screen brightness
- `LOCK_SCREEN` - Lock computer
- `SLEEP_COMPUTER` - Put computer to sleep
- `RESTART_COMPUTER` - Restart system
- `SHUTDOWN_COMPUTER` - Shutdown system
- `OPEN_TASK_MANAGER` - Open task manager
- `OPEN_SETTINGS` - Open system settings

### 📧 Communication & Productivity
- `SEND_EMAIL` - Send email (if configured)
- `OPEN_CALENDAR` - Open calendar app
- `CREATE_EVENT` - Create calendar event
- `OPEN_NOTES` - Open notes app
- `CREATE_NOTE` - Create new note
- `OPEN_CALCULATOR` - Open calculator
- `CALCULATE` - Perform calculations
- `OPEN_CAMERA` - Open camera app
- `TAKE_PHOTO` - Take photo
- `OPEN_MAPS` - Open maps application
- `GET_LOCATION` - Get current location

### 🔍 Search & Information
- `SEARCH_WEB` - Search on Google
- `SEARCH_YOUTUBE` - Search on YouTube
- `SEARCH_WIKIPEDIA` - Search Wikipedia
- `GET_WEATHER` - Get weather information
- `GET_TIME` - Get current time
- `GET_DATE` - Get current date
- `TRANSLATE_TEXT` - Translate text
- `DEFINE_WORD` - Define word
- `GET_NEWS` - Get latest news
- `GET_STOCK_PRICE` - Get stock prices

### 🎵 Media Control
- `PLAY_MUSIC` - Play music
- `PAUSE_MUSIC` - Pause music
- `NEXT_TRACK` - Next song
- `PREVIOUS_TRACK` - Previous song
- `VOLUME_SET` - Set specific volume level
- `PLAY_VIDEO` - Play video
- `PAUSE_VIDEO` - Pause video
- `FULLSCREEN` - Toggle fullscreen
- `SUBTITLES` - Toggle subtitles

### 🛠️ Development & Technical
- `OPEN_TERMINAL` - Open terminal/command prompt
- `RUN_COMMAND` - Execute terminal command
- `OPEN_CODE_EDITOR` - Open VS Code/editor
- `OPEN_BROWSER_DEVTOOLS` - Open developer tools
- `CLEAR_CONSOLE` - Clear browser console
- `INSPECT_ELEMENT` - Inspect page element
- `GET_PAGE_SOURCE` - Get page HTML source
- `GET_CONSOLE_LOGS` - Get console logs
- `MEASURE_PERFORMANCE` - Measure page performance

### 🔐 Security & Privacy
- `CLEAR_BROWSER_DATA` - Clear browser cache/cookies
- `OPEN_INCOGNITO` - Open incognito window
- `CHANGE_PASSWORD` - Change password (if configured)
- `ENABLE_2FA` - Enable two-factor authentication
- `SCAN_VIRUS` - Run virus scan
- `UPDATE_SOFTWARE` - Check for updates

### 📊 Data & Analytics
- `EXPORT_DATA` - Export data to file
- `IMPORT_DATA` - Import data from file
- `BACKUP_FILES` - Backup important files
- `SYNC_FILES` - Sync files to cloud
- `ANALYZE_DISK_USAGE` - Check disk space
- `CLEANUP_FILES` - Clean up temporary files

## Implementation Priority 🎯

### High Priority (Most Useful)
1. **File Management**: `DELETE_FILE`, `RENAME_FILE`, `COPY_FILE`, `MOVE_FILE`
2. **Browser Navigation**: `REFRESH_PAGE`, `GO_BACK`, `GO_FORWARD`, `NEW_TAB`
3. **Advanced Mouse**: `DOUBLE_CLICK`, `RIGHT_CLICK`, `DRAG_DROP`
4. **Keyboard**: `KEY_PRESS`, `PASTE_TEXT`, `COPY_TEXT`
5. **System Control**: `VOLUME_UP/DOWN`, `BRIGHTNESS_UP/DOWN`

### Medium Priority
1. **Form Automation**: `FILL_FORM`, `SELECT_DROPDOWN`, `CHECK_CHECKBOX`
2. **Media Control**: `PLAY_MUSIC`, `PAUSE_MUSIC`, `NEXT_TRACK`
3. **Search**: `SEARCH_WEB`, `GET_WEATHER`, `GET_TIME`
4. **Productivity**: `OPEN_CALENDAR`, `CREATE_NOTE`, `OPEN_CALCULATOR`

### Low Priority (Nice to Have)
1. **Advanced System**: `LOCK_SCREEN`, `RESTART_COMPUTER`
2. **Development**: `OPEN_TERMINAL`, `RUN_COMMAND`, `OPEN_CODE_EDITOR`
3. **Security**: `CLEAR_BROWSER_DATA`, `SCAN_VIRUS`

## Command Format Examples 📝

### File Operations
```
User: "Delete the test file"
Agent: "Deleting file. [CMD:DELETE_FILE:~/Downloads/test.txt]"

User: "Rename my document to final version"
Agent: "Renaming file. [CMD:RENAME_FILE:~/Documents/draft.txt:final-version.txt]"

User: "Copy this folder to desktop"
Agent: "Copying folder. [CMD:COPY_FILE:~/Downloads/project:~/Desktop/project]"
```

### Browser Automation
```
User: "Refresh the page"
Agent: "Refreshing page. [CMD:REFRESH_PAGE:]"

User: "Go back"
Agent: "Going back. [CMD:GO_BACK:]"

User: "Open new tab"
Agent: "Opening tab. [CMD:NEW_TAB:]"

User: "Take screenshot"
Agent: "Taking screenshot. [CMD:TAKE_SCREENSHOT:]"
```

### Advanced Mouse Control
```
User: "Double click the file"
Agent: "Double clicking. [CMD:DOUBLE_CLICK:file]"

User: "Right click here"
Agent: "Right clicking. [CMD:RIGHT_CLICK:menu]"

User: "Press Enter"
Agent: "Pressing key. [CMD:KEY_PRESS:Enter]"

User: "Copy this text"
Agent: "Copying text. [CMD:COPY_TEXT:]"
```

### System Control
```
User: "Turn up the volume"
Agent: "Volume up. [CMD:VOLUME_UP:]"

User: "Make it brighter"
Agent: "Brightness up. [CMD:BRIGHTNESS_UP:]"

User: "Lock my computer"
Agent: "Locking screen. [CMD:LOCK_SCREEN:]"
```

## Technical Implementation Notes 🔧

### Server-Side Commands (server.js)
- File operations, system control, media control
- Use platform-specific commands (macOS, Windows, Linux)
- Implement proper error handling and validation

### Browser-Side Commands (content.js)
- Page interaction, form filling, element manipulation
- Use Chrome Extension APIs and DOM manipulation
- Handle cross-origin restrictions

### Hybrid Commands
- Some commands may need both server and browser components
- Coordinate between local server and content script
- Implement fallback mechanisms

## Voice Command Patterns 🎤

### Natural Language Examples
- "Delete the file called test.txt"
- "Rename my document to final version"
- "Copy this folder to the desktop"
- "Refresh the page"
- "Go back to the previous page"
- "Open a new tab"
- "Double click the download button"
- "Right click on the image"
- "Press Enter to submit"
- "Turn up the volume"
- "Make the screen brighter"
- "Lock my computer"

### Command Mapping Strategy
- Use fuzzy matching for natural language
- Prioritize most common actions
- Provide context-aware suggestions
- Handle synonyms and variations

This comprehensive command list would make the Atlas Voice Agent incredibly powerful and versatile for everyday tasks!
