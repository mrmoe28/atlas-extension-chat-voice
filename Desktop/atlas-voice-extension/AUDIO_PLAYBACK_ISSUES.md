# Audio Playback Issues - Solutions

## Issue: "Unchecked runtime.lastError: No current drop data"

**Problem**: Console error when using drag and drop functionality in Chrome extension.

**Root Cause**: The `new DataTransfer()` constructor is not universally supported across all browsers and contexts, causing runtime errors when the extension tries to simulate drag and drop operations.

**Solution**: Implement robust DataTransfer creation with fallbacks:

```javascript
// Helper function to create DataTransfer object with fallbacks
function createDataTransfer(files) {
  let dataTransfer = null;

  try {
    // Try to create DataTransfer object - not supported in all browsers
    if (typeof DataTransfer !== 'undefined') {
      dataTransfer = new DataTransfer();
    }
  } catch (error) {
    // Fallback: create a mock DataTransfer-like object
    console.log('DataTransfer constructor not available, using fallback');
    dataTransfer = {
      items: [],
      types: [],
      files: [],
      dropEffect: 'copy',
      effectAllowed: 'all',
      getData: function(type) { return ''; },
      setData: function(type, data) { },
      clearData: function(type) { },
      setDragImage: function() { }
    };
  }

  if (dataTransfer && files && files.length > 0) {
    try {
      files.forEach(file => {
        if (file instanceof File) {
          if (dataTransfer.items && typeof dataTransfer.items.add === 'function') {
            dataTransfer.items.add(file);
          }
          if (dataTransfer.files) {
            dataTransfer.files.push(file);
          }
        } else if (typeof file === 'string') {
          // Create a simple text file
          const blob = new Blob([file], { type: 'text/plain' });
          const fileObj = new File([blob], 'file.txt', { type: 'text/plain' });
          if (dataTransfer.items && typeof dataTransfer.items.add === 'function') {
            dataTransfer.items.add(fileObj);
          }
          if (dataTransfer.files) {
            dataTransfer.files.push(fileObj);
          }
        }
      });
    } catch (error) {
      console.log('Error adding files to DataTransfer:', error.message);
    }
  }

  return dataTransfer;
}
```

**Implementation**: Replace all `new DataTransfer()` calls with `createDataTransfer(files)` and ensure the fallback function is available.

## Issue: Atlas Audio Not Playing

**Problem**: Atlas responses don't play audio when using Vercel server.

**Root Cause**: Vercel serverless functions don't have access to local filesystem for Piper TTS voice models.

**Solution**:
1. Run local Atlas server: `cd dev/server && npm run dev`
2. Update extension settings to use `http://localhost:8787` instead of Vercel URL
3. Reload extension

**Files to Update**:
- `sidepanel.html`: Change serverUrl default value
- `dev/build-tools/extension/sidepanel.html`: Change serverUrl default value

**Prevention**: Always use local server for Piper TTS functionality, Vercel only for API key fallback.

## Issue: Hamburger Menu Not Clickable

**Problem**: Hamburger menu button becomes unclickable when settings modal is open.

**Root Cause**: Settings modal backdrop has `z-index: 1000` and covers entire screen, blocking clicks on header with `z-index: 100`.

**Solution**: Increase header z-index above modal backdrop:

```css
header {
  /* ... other styles ... */
  z-index: 1100; /* Higher than modal's z-index: 1000 */
}
```

**Files to Update**:
- `styles.css`: Change header z-index from 100 to 1100
- `dev/build-tools/extension/styles.css`: Same change
- Rebuild extension

**Prevention**: Ensure interactive UI elements have higher z-index than modal overlays.
