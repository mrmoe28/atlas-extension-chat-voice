# Function Wrapping Pattern - Best Practices

## The Problem

When trying to intercept or wrap an existing function, using a function declaration causes a duplicate identifier error:

```javascript
// ❌ WRONG - Causes "Identifier already been declared" error
const originalEnableMic = enableMic;
function enableMic() {  // ERROR: enableMic is already declared
  originalEnableMic();
  // ... additional code
}
```

## The Solution

Use function expression assignment instead:

```javascript
// ✅ CORRECT - Properly wraps the function
const originalEnableMic = enableMic;
enableMic = function() {
  originalEnableMic();
  // ... additional code
};
```

## Why This Happens

1. **Function declarations are hoisted** - They're processed before any code runs
2. **Hoisting creates the identifier** before the `const originalEnableMic = enableMic;` line
3. **This causes a conflict** - You can't have two declarations with the same name in the same scope

## Alternative Patterns

### Pattern 1: Function Expression (Recommended)
```javascript
const originalEnableMic = enableMic;
enableMic = function() {
  originalEnableMic();
  // Enhanced functionality
};
```

### Pattern 2: IIFE Wrapper
```javascript
enableMic = (function(original) {
  return function() {
    original();
    // Enhanced functionality
  };
})(enableMic);
```

### Pattern 3: Event Listener Pattern (for DOM events)
```javascript
// For event handlers, use addEventListener instead
const originalHandler = button.onclick;
button.addEventListener('click', function(e) {
  if (originalHandler) originalHandler.call(this, e);
  // Enhanced functionality
});
```

## What Was Fixed

**File:** `sidepanel.js:2194`

**Before (broken):**
```javascript
const originalEnableMic = enableMic;
function enableMic() {  // ❌ Duplicate declaration
  originalEnableMic();
  // ...
}
```

**After (fixed):**
```javascript
const originalEnableMic = enableMic;
enableMic = function() {  // ✅ Function reassignment
  originalEnableMic();
  // ...
};
```

## Incomplete Code Alert

The `enhancedConnect` function (line 2181) is defined but never used. It should be wired up:

```javascript
const originalConnect = els.connectBtn.onclick;
function enhancedConnect() {
  if (originalConnect) originalConnect();
  // ... wake word initialization
}

// Missing: Actually assign it!
els.connectBtn.onclick = enhancedConnect;
// OR use addEventListener pattern instead
```

## Prevention Checklist

- [ ] Use function expression assignment, not function declaration
- [ ] Ensure wrapped function is actually used/assigned
- [ ] Test for syntax errors before committing
- [ ] Run ESLint to catch duplicate declarations
- [ ] Consider using addEventListener instead of onclick handlers

## ESLint Rule

Add this to your ESLint config to catch this automatically:

```json
{
  "rules": {
    "no-redeclare": "error",
    "no-func-assign": "error"
  }
}
```
