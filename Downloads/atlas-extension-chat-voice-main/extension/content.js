// Atlas Voice Panel - Content Script for Browser Automation
// This script runs in web pages to enable browser automation

console.log('Atlas Voice Panel content script loaded');

// Listen for messages from the side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  try {
    switch (request.action) {
      case 'clickElement':
        handleClickElement(request, sendResponse);
        break;
      case 'typeText':
        handleTypeText(request, sendResponse);
        break;
      case 'scrollPage':
        handleScrollPage(request, sendResponse);
        break;
      case 'getPageInfo':
        handleGetPageInfo(request, sendResponse);
        break;
      case 'findElement':
        handleFindElement(request, sendResponse);
        break;
      case 'mouseMove':
        handleMouseMove(request, sendResponse);
        break;
      case 'mouseClick':
        handleMouseClick(request, sendResponse);
        break;
      case 'takeScreenshot':
        handleTakeScreenshot(request, sendResponse);
        break;
      case 'doubleClick':
        handleDoubleClick(request, sendResponse);
        break;
      case 'rightClick':
        handleRightClick(request, sendResponse);
        break;
      case 'hoverElement':
        handleHoverElement(request, sendResponse);
        break;
      case 'clearField':
        handleClearField(request, sendResponse);
        break;
      case 'selectAll':
        handleSelectAll(request, sendResponse);
        break;
      case 'copyText':
        handleCopyText(request, sendResponse);
        break;
      case 'pasteText':
        handlePasteText(request, sendResponse);
        break;
      case 'dragDrop':
        handleDragDrop(request, sendResponse);
        break;
      case 'keyPress':
        handleKeyPress(request, sendResponse);
        break;
      case 'keyCombination':
        handleKeyCombination(request, sendResponse);
        break;
      case 'fillForm':
        handleFillForm(request, sendResponse);
        break;
      case 'extractData':
        handleExtractData(request, sendResponse);
        break;
      case 'debugElements':
        handleDebugElements(request, sendResponse);
        break;
      case 'extractYouTubeTranscript':
        handleExtractYouTubeTranscript(request, sendResponse);
        break;
      case 'extractPageText':
        handleExtractPageText(request, sendResponse);
        break;
      default:
        sendResponse({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Content script error:', error);
    sendResponse({ error: error.message });
  }
  
  return true; // Keep message channel open for async response
});

// Click an element by selector
function handleClickElement(request, sendResponse) {
  try {
    const { selector, text } = request;
    let element;
    
    if (selector) {
      element = document.querySelector(selector);
    } else if (text) {
      // Find element by text content with smart matching
      element = findElementByTextSmart(text);
    }
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        element.click();
        sendResponse({ success: true, message: `Clicked element: ${selector || text}` });
      }, 500);
    } else {
      sendResponse({ error: `Element not found: ${selector || text}` });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Type text into an element
function handleTypeText(request, sendResponse) {
  try {
    const { selector, text, clear } = request;
    const element = document.querySelector(selector);
    
    if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.contentEditable === 'true')) {
      element.focus();
      
      if (clear) {
        element.value = '';
        element.textContent = '';
      }
      
      // Simulate typing
      element.value = text;
      element.textContent = text;
      
      // Trigger input events
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      sendResponse({ success: true, message: `Typed "${text}" into ${selector}` });
    } else {
      sendResponse({ error: `Input element not found: ${selector}` });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Scroll the page
function handleScrollPage(request, sendResponse) {
  try {
    const { direction, amount } = request;
    const scrollAmount = amount || 300;
    
    switch (direction) {
      case 'up':
        window.scrollBy(0, -scrollAmount);
        break;
      case 'down':
        window.scrollBy(0, scrollAmount);
        break;
      case 'left':
        window.scrollBy(-scrollAmount, 0);
        break;
      case 'right':
        window.scrollBy(scrollAmount, 0);
        break;
      case 'top':
        window.scrollTo(0, 0);
        break;
      case 'bottom':
        window.scrollTo(0, document.body.scrollHeight);
        break;
      default:
        sendResponse({ error: 'Invalid scroll direction' });
        return;
    }
    
    sendResponse({ success: true, message: `Scrolled ${direction}` });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Get page information
function handleGetPageInfo(request, sendResponse) {
  try {
    const info = {
      title: document.title,
      url: window.location.href,
      domain: window.location.hostname,
      elements: {
        links: document.querySelectorAll('a').length,
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        images: document.querySelectorAll('img').length
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    sendResponse({ success: true, data: info });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Find element by text content
function handleFindElement(request, sendResponse) {
  try {
    const { text } = request;
    const element = findElementByText(text);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      sendResponse({ 
        success: true, 
        data: {
          tagName: element.tagName,
          text: element.textContent.trim(),
          position: { x: rect.left, y: rect.top },
          size: { width: rect.width, height: rect.height }
        }
      });
    } else {
      sendResponse({ error: `Element with text "${text}" not found` });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Mouse move simulation
function handleMouseMove(request, sendResponse) {
  try {
    const { x, y } = request;
    
    // Create mouse move event
    const event = new MouseEvent('mousemove', {
      clientX: x,
      clientY: y,
      bubbles: true
    });
    
    document.dispatchEvent(event);
    sendResponse({ success: true, message: `Mouse moved to (${x}, ${y})` });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Mouse click simulation
function handleMouseClick(request, sendResponse) {
  try {
    const { x, y, button = 'left' } = request;
    
    // Create mouse click event
    const event = new MouseEvent('click', {
      clientX: x,
      clientY: y,
      button: button === 'right' ? 2 : 0,
      bubbles: true
    });
    
    document.dispatchEvent(event);
    sendResponse({ success: true, message: `Mouse clicked at (${x}, ${y})` });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Helper function to find element by text with smart matching
function findElementByTextSmart(text) {
  const searchText = text.toLowerCase().trim();
  const elements = document.querySelectorAll('*');
  
  // Priority order for element types
  const prioritySelectors = [
    'button', 'a', 'input[type="submit"]', 'input[type="button"]',
    '[role="button"]', '[onclick]', '.btn', '.button',
    // YouTube specific selectors
    'ytd-video-renderer', 'ytd-compact-video-renderer', 'ytd-rich-item-renderer',
    'h3', 'h2', 'h1', '[id*="video-title"]', '[class*="video-title"]',
    'span[class*="title"]', 'div[class*="title"]'
  ];
  
  // First try priority elements (buttons, links, etc.)
  for (const selector of prioritySelectors) {
    const priorityElements = document.querySelectorAll(selector);
    for (const element of priorityElements) {
      if (elementMatchesText(element, searchText)) {
        console.log('Found element by selector:', selector, element);
        return element;
      }
    }
  }
  
  // Try to find YouTube video elements specifically
  if (window.location.hostname.includes('youtube.com')) {
    const videoElements = findYouTubeVideoElements(searchText);
    if (videoElements.length > 0) {
      console.log('Found YouTube video elements:', videoElements);
      return videoElements[0]; // Return first match
    }
  }
  
  // Then try all elements
  for (const element of elements) {
    if (elementMatchesText(element, searchText)) {
      console.log('Found element by text search:', element);
      return element;
    }
  }
  
  console.log('No element found for text:', searchText);
  return null;
}

// YouTube-specific video element finder
function findYouTubeVideoElements(searchText) {
  const videoElements = [];
  
  // Try different YouTube selectors
  const youtubeSelectors = [
    'ytd-video-renderer h3 a',
    'ytd-compact-video-renderer h3 a', 
    'ytd-rich-item-renderer h3 a',
    'ytd-video-renderer #video-title',
    'ytd-compact-video-renderer #video-title',
    'ytd-rich-item-renderer #video-title',
    'ytd-video-renderer a#video-title',
    'ytd-compact-video-renderer a#video-title',
    'ytd-rich-item-renderer a#video-title'
  ];
  
  for (const selector of youtubeSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      if (elementMatchesText(element, searchText)) {
        videoElements.push(element);
      }
    }
  }
  
  // Also try finding by partial text match in video containers
  const videoContainers = document.querySelectorAll('ytd-video-renderer, ytd-compact-video-renderer, ytd-rich-item-renderer');
  for (const container of videoContainers) {
    const titleElement = container.querySelector('h3 a, #video-title, a#video-title');
    if (titleElement && elementMatchesText(titleElement, searchText)) {
      videoElements.push(titleElement);
    }
  }
  
  return videoElements;
}

// Helper function to check if element matches text
function elementMatchesText(element, searchText) {
  // Check text content with fuzzy matching
  if (element.textContent) {
    const elementText = element.textContent.toLowerCase().trim();
    
    // Exact match
    if (elementText === searchText) {
      return true;
    }
    
    // Contains match
    if (elementText.includes(searchText)) {
      return true;
    }
    
    // Fuzzy match for partial words
    const searchWords = searchText.split(' ').filter(word => word.length > 2);
    const elementWords = elementText.split(' ').filter(word => word.length > 2);
    
    if (searchWords.length > 0) {
      const matchCount = searchWords.filter(searchWord => 
        elementWords.some(elementWord => elementWord.includes(searchWord))
      ).length;
      
      // If more than 50% of search words match, consider it a match
      if (matchCount / searchWords.length >= 0.5) {
        return true;
      }
    }
  }
  
  // Check attributes
  const attributes = ['title', 'alt', 'aria-label', 'placeholder', 'value'];
  for (const attr of attributes) {
    if (element.getAttribute(attr)) {
      const attrValue = element.getAttribute(attr).toLowerCase();
      if (attrValue.includes(searchText)) {
        return true;
      }
    }
  }
  
  // Check data attributes
  for (const attr of element.attributes) {
    if (attr.name.startsWith('data-') && attr.value.toLowerCase().includes(searchText)) {
      return true;
    }
  }
  
  return false;
}

// Helper function to find element by text (legacy)
function findElementByText(text) {
  const elements = document.querySelectorAll('*');
  for (const element of elements) {
    if (element.textContent && element.textContent.trim().toLowerCase().includes(text.toLowerCase())) {
      return element;
    }
  }
  return null;
}

// Helper function to highlight element (for debugging)
function highlightElement(element) {
  const originalStyle = element.style.cssText;
  element.style.cssText = 'border: 2px solid red !important; background-color: yellow !important;';
  
  setTimeout(() => {
    element.style.cssText = originalStyle;
  }, 2000);
}

// Take screenshot of current page
function handleTakeScreenshot(request, sendResponse) {
  try {
    // Use html2canvas if available, otherwise fallback
    if (typeof html2canvas !== 'undefined') {
      html2canvas(document.body).then(canvas => {
        const dataURL = canvas.toDataURL('image/png');
        sendResponse({ success: true, data: dataURL });
      });
    } else {
      // Fallback: return page info
      sendResponse({ 
        success: true, 
        message: 'Screenshot taken (basic mode)',
        data: {
          title: document.title,
          url: window.location.href,
          viewport: { width: window.innerWidth, height: window.innerHeight }
        }
      });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Double click element
function handleDoubleClick(request, sendResponse) {
  try {
    const { text } = request;
    const element = findElementByTextSmart(text);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const event = new MouseEvent('dblclick', { bubbles: true });
        element.dispatchEvent(event);
        sendResponse({ success: true, message: `Double-clicked: ${text}` });
      }, 500);
    } else {
      sendResponse({ error: `Element not found: ${text}` });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Right click element
function handleRightClick(request, sendResponse) {
  try {
    const { text } = request;
    const element = findElementByTextSmart(text);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const event = new MouseEvent('contextmenu', { bubbles: true });
        element.dispatchEvent(event);
        sendResponse({ success: true, message: `Right-clicked: ${text}` });
      }, 500);
    } else {
      sendResponse({ error: `Element not found: ${text}` });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Hover over element
function handleHoverElement(request, sendResponse) {
  try {
    const { text } = request;
    const element = findElementByTextSmart(text);
    
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const event = new MouseEvent('mouseover', { bubbles: true });
        element.dispatchEvent(event);
        sendResponse({ success: true, message: `Hovered over: ${text}` });
      }, 500);
    } else {
      sendResponse({ error: `Element not found: ${text}` });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Clear input field
function handleClearField(request, sendResponse) {
  try {
    const { selector } = request;
    const element = document.querySelector(selector);
    
    if (element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')) {
      element.focus();
      element.value = '';
      element.dispatchEvent(new Event('input', { bubbles: true }));
      sendResponse({ success: true, message: `Cleared field: ${selector}` });
    } else {
      sendResponse({ error: `Input field not found: ${selector}` });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Select all text
function handleSelectAll(request, sendResponse) {
  try {
    document.execCommand('selectAll');
    sendResponse({ success: true, message: 'Selected all text' });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Copy text to clipboard
function handleCopyText(request, sendResponse) {
  try {
    const success = document.execCommand('copy');
    if (success) {
      sendResponse({ success: true, message: 'Text copied to clipboard' });
    } else {
      sendResponse({ error: 'Failed to copy text' });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Paste text from clipboard
function handlePasteText(request, sendResponse) {
  try {
    const { text } = request;
    const activeElement = document.activeElement;
    
    if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
      activeElement.value = text;
      activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      sendResponse({ success: true, message: `Pasted: ${text}` });
    } else {
      sendResponse({ error: 'No active input field' });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Drag and drop elements
function handleDragDrop(request, sendResponse) {
  try {
    const { source, target } = request;
    const sourceElement = findElementByTextSmart(source);
    const targetElement = findElementByTextSmart(target);
    
    if (sourceElement && targetElement) {
      // Simulate drag and drop
      const dragEvent = new DragEvent('dragstart', { bubbles: true });
      sourceElement.dispatchEvent(dragEvent);
      
      setTimeout(() => {
        const dropEvent = new DragEvent('drop', { bubbles: true });
        targetElement.dispatchEvent(dropEvent);
        sendResponse({ success: true, message: `Dragged ${source} to ${target}` });
      }, 100);
    } else {
      sendResponse({ error: `Elements not found: ${source} or ${target}` });
    }
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Press specific key
function handleKeyPress(request, sendResponse) {
  try {
    const { key } = request;
    const keyCode = getKeyCode(key);
    
    const event = new KeyboardEvent('keydown', {
      key: key,
      keyCode: keyCode,
      bubbles: true
    });
    
    document.dispatchEvent(event);
    
    setTimeout(() => {
      const keyUpEvent = new KeyboardEvent('keyup', {
        key: key,
        keyCode: keyCode,
        bubbles: true
      });
      document.dispatchEvent(keyUpEvent);
    }, 50);
    
    sendResponse({ success: true, message: `Pressed key: ${key}` });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Press key combination
function handleKeyCombination(request, sendResponse) {
  try {
    const { keys } = request;
    const keyArray = keys.split('+');
    
    // Simulate key combination
    keyArray.forEach(key => {
      const keyCode = getKeyCode(key.trim());
      const event = new KeyboardEvent('keydown', {
        key: key.trim(),
        keyCode: keyCode,
        bubbles: true
      });
      document.dispatchEvent(event);
    });
    
    setTimeout(() => {
      keyArray.forEach(key => {
        const keyCode = getKeyCode(key.trim());
        const event = new KeyboardEvent('keyup', {
          key: key.trim(),
          keyCode: keyCode,
          bubbles: true
        });
        document.dispatchEvent(event);
      });
    }, 100);
    
    sendResponse({ success: true, message: `Pressed combination: ${keys}` });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Helper function to get key code
function getKeyCode(key) {
  const keyMap = {
    'Enter': 13,
    'Escape': 27,
    'Tab': 9,
    'Space': 32,
    'Backspace': 8,
    'Delete': 46,
    'ArrowUp': 38,
    'ArrowDown': 40,
    'ArrowLeft': 37,
    'ArrowRight': 39,
    'Ctrl': 17,
    'Alt': 18,
    'Shift': 16,
    'Meta': 91
  };
  
  return keyMap[key] || key.charCodeAt(0);
}

// Fill form fields
function handleFillForm(request, sendResponse) {
  try {
    const { fields } = request;
    let filledCount = 0;
    
    for (const [fieldName, value] of Object.entries(fields)) {
      // Try different selectors for the field
      const selectors = [
        `input[name="${fieldName}"]`,
        `input[id="${fieldName}"]`,
        `input[placeholder*="${fieldName}"]`,
        `textarea[name="${fieldName}"]`,
        `textarea[id="${fieldName}"]`,
        `select[name="${fieldName}"]`,
        `select[id="${fieldName}"]`
      ];
      
      let element = null;
      for (const selector of selectors) {
        element = document.querySelector(selector);
        if (element) break;
      }
      
      if (element) {
        element.focus();
        element.value = value;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        filledCount++;
      }
    }
    
    sendResponse({ 
      success: true, 
      message: `Filled ${filledCount} form fields`,
      filledCount 
    });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Extract data from page
function handleExtractData(request, sendResponse) {
  try {
    const { data_type, selector } = request;
    let data = {};
    
    switch (data_type) {
      case 'text':
        if (selector) {
          const elements = document.querySelectorAll(selector);
          data.text = Array.from(elements).map(el => el.textContent.trim());
        } else {
          data.text = document.body.textContent.trim();
        }
        break;
        
      case 'links':
        const links = document.querySelectorAll('a[href]');
        data.links = Array.from(links).map(link => ({
          text: link.textContent.trim(),
          href: link.href
        }));
        break;
        
      case 'images':
        const images = document.querySelectorAll('img[src]');
        data.images = Array.from(images).map(img => ({
          src: img.src,
          alt: img.alt,
          title: img.title
        }));
        break;
        
      case 'forms':
        const forms = document.querySelectorAll('form');
        data.forms = Array.from(forms).map(form => {
          const inputs = form.querySelectorAll('input, textarea, select');
          return {
            action: form.action,
            method: form.method,
            fields: Array.from(inputs).map(input => ({
              name: input.name,
              type: input.type,
              placeholder: input.placeholder,
              value: input.value
            }))
          };
        });
        break;
        
      case 'tables':
        const tables = document.querySelectorAll('table');
        data.tables = Array.from(tables).map(table => {
          const rows = table.querySelectorAll('tr');
          return Array.from(rows).map(row => {
            const cells = row.querySelectorAll('td, th');
            return Array.from(cells).map(cell => cell.textContent.trim());
          });
        });
        break;
        
      case 'all':
        data = {
          title: document.title,
          url: window.location.href,
          text: document.body.textContent.trim(),
          links: Array.from(document.querySelectorAll('a[href]')).map(link => ({
            text: link.textContent.trim(),
            href: link.href
          })),
          images: Array.from(document.querySelectorAll('img[src]')).map(img => ({
            src: img.src,
            alt: img.alt
          }))
        };
        break;
        
      default:
        sendResponse({ error: 'Invalid data type' });
        return;
    }
    
    sendResponse({ success: true, data });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Debug elements on page
function handleDebugElements(request, sendResponse) {
  try {
    const { text } = request;
    const searchText = text.toLowerCase().trim();
    
    // Find all potential matches
    const allElements = document.querySelectorAll('*');
    const matches = [];
    
    for (const element of allElements) {
      if (element.textContent && element.textContent.toLowerCase().includes(searchText)) {
        const rect = element.getBoundingClientRect();
        matches.push({
          tagName: element.tagName,
          text: element.textContent.trim().substring(0, 100),
          id: element.id,
          className: element.className,
          position: { x: rect.left, y: rect.top },
          size: { width: rect.width, height: rect.height },
          visible: rect.width > 0 && rect.height > 0
        });
      }
    }
    
    sendResponse({
      success: true,
      data: {
        searchText,
        totalMatches: matches.length,
        matches: matches.slice(0, 10) // Limit to first 10 matches
      }
    });
  } catch (error) {
    sendResponse({ error: error.message });
  }
}

// Extract YouTube video transcript
async function handleExtractYouTubeTranscript(request, sendResponse) {
  try {
    // Check if we're on a YouTube video page
    const isYouTube = window.location.hostname.includes('youtube.com') &&
                      window.location.pathname.includes('/watch');

    if (!isYouTube) {
      sendResponse({
        error: 'Not a YouTube video page',
        message: 'Please navigate to a YouTube video to extract the transcript'
      });
      return;
    }

    // Get video title
    const videoTitle = document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.textContent ||
                       document.querySelector('h1.title')?.textContent ||
                       'Unknown Video';

    // Method 1: Try to extract from existing transcript panel if open
    let transcriptText = '';
    const transcriptSegments = document.querySelectorAll('ytd-transcript-segment-renderer');

    if (transcriptSegments.length > 0) {
      transcriptText = Array.from(transcriptSegments).map(segment => {
        const text = segment.querySelector('.segment-text')?.textContent?.trim() || '';
        return text;
      }).filter(text => text).join(' ');
    }

    // Method 2: Try to open transcript panel and extract
    if (!transcriptText) {
      // Look for the transcript button in the description
      const moreActionsButton = document.querySelector('button[aria-label*="More actions"]') ||
                                 document.querySelector('#expand');

      // Try to find and click "Show transcript" button
      const showTranscriptButton = Array.from(document.querySelectorAll('button, ytd-button-renderer')).find(el => {
        const text = el.textContent?.toLowerCase() || '';
        return text.includes('transcript') || text.includes('show transcript');
      });

      if (showTranscriptButton) {
        showTranscriptButton.click();

        // Wait for transcript to load
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Try to extract again
        const segments = document.querySelectorAll('ytd-transcript-segment-renderer');
        if (segments.length > 0) {
          transcriptText = Array.from(segments).map(segment => {
            const text = segment.querySelector('.segment-text')?.textContent?.trim() || '';
            return text;
          }).filter(text => text).join(' ');
        }
      }
    }

    // Method 3: Try to extract from transcript in engagement panel
    if (!transcriptText) {
      const transcriptPanel = document.querySelector('ytd-transcript-renderer');
      if (transcriptPanel) {
        const segments = transcriptPanel.querySelectorAll('ytd-transcript-segment-renderer');
        transcriptText = Array.from(segments).map(segment => {
          const text = segment.querySelector('.segment-text')?.textContent?.trim() || '';
          return text;
        }).filter(text => text).join(' ');
      }
    }

    if (transcriptText) {
      sendResponse({
        success: true,
        data: {
          title: videoTitle,
          transcript: transcriptText,
          url: window.location.href,
          message: `Successfully extracted transcript from "${videoTitle}"`
        }
      });
    } else {
      sendResponse({
        error: 'Transcript not available',
        message: 'This video does not have a transcript available, or it could not be extracted. Please try opening the transcript manually first.'
      });
    }
  } catch (error) {
    console.error('YouTube transcript extraction error:', error);
    sendResponse({ error: error.message });
  }
}

// Extract all visible text from the current page
function handleExtractPageText(request, sendResponse) {
  try {
    const { includeLinks = false, format = 'plain' } = request;

    // Get page title
    const pageTitle = document.title;
    const pageUrl = window.location.href;

    // Remove script, style, and other non-content elements
    const clone = document.body.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll('script, style, nav, header, footer, aside, [role="navigation"]');
    elementsToRemove.forEach(el => el.remove());

    // Extract text content
    let textContent = clone.textContent || '';

    // Clean up whitespace
    textContent = textContent
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n')  // Remove empty lines
      .trim();

    // Extract links if requested
    let links = [];
    if (includeLinks) {
      const linkElements = document.querySelectorAll('a[href]');
      links = Array.from(linkElements).map(link => ({
        text: link.textContent.trim(),
        href: link.href
      })).filter(link => link.text && link.href);
    }

    // Format output
    let output = '';
    if (format === 'markdown') {
      output = `# ${pageTitle}\n\nURL: ${pageUrl}\n\n${textContent}`;
      if (links.length > 0) {
        output += '\n\n## Links\n';
        links.forEach(link => {
          output += `\n- [${link.text}](${link.href})`;
        });
      }
    } else {
      output = `Title: ${pageTitle}\nURL: ${pageUrl}\n\n${textContent}`;
      if (links.length > 0) {
        output += '\n\nLinks:\n';
        links.forEach(link => {
          output += `\n- ${link.text}: ${link.href}`;
        });
      }
    }

    sendResponse({
      success: true,
      data: {
        title: pageTitle,
        url: pageUrl,
        text: textContent,
        links: links,
        formatted: output,
        wordCount: textContent.split(/\s+/).length
      }
    });
  } catch (error) {
    console.error('Page text extraction error:', error);
    sendResponse({ error: error.message });
  }
}
