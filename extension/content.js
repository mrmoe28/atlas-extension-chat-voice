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
    '[role="button"]', '[onclick]', '.btn', '.button'
  ];
  
  // First try priority elements (buttons, links, etc.)
  for (const selector of prioritySelectors) {
    const priorityElements = document.querySelectorAll(selector);
    for (const element of priorityElements) {
      if (elementMatchesText(element, searchText)) {
        return element;
      }
    }
  }
  
  // Then try all elements
  for (const element of elements) {
    if (elementMatchesText(element, searchText)) {
      return element;
    }
  }
  
  return null;
}

// Helper function to check if element matches text
function elementMatchesText(element, searchText) {
  // Check text content
  if (element.textContent && element.textContent.toLowerCase().includes(searchText)) {
    return true;
  }
  
  // Check attributes
  const attributes = ['title', 'alt', 'aria-label', 'placeholder', 'value'];
  for (const attr of attributes) {
    if (element.getAttribute(attr) && element.getAttribute(attr).toLowerCase().includes(searchText)) {
      return true;
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
