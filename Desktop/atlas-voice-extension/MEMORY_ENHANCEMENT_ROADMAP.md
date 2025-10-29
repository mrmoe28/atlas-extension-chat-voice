# Memory Architecture Enhancement Roadmap

## Phase 1: User & Session Management (Week 1)

### 1.1 Implement Persistent User ID

**File**: `sidepanel.js`

**Current** (Line 185):
```javascript
let sessionId = Date.now().toString();
```

**Enhanced**:
```javascript
// Generate unique device/user ID once, persist in localStorage
function initializeUserSession() {
  let userId = localStorage.getItem('atlasVoice_userId');
  if (!userId) {
    userId = 'user_' + crypto.getRandomValues(new Uint8Array(16)).join('');
    localStorage.setItem('atlasVoice_userId', userId);
  }
  
  // New session per launch, but tied to user
  const sessionId = userId + '_' + Date.now().toString();
  
  return { userId, sessionId };
}

// At startup
const { userId, sessionId } = initializeUserSession();
```

**Database Impact**:
- Replace all `'default'` with `userId` variable
- Enables multi-user tracking
- Allows per-user memory isolation

---

### 1.2 Store Session State in localStorage

**File**: `sidepanel.js`

**Add**:
```javascript
// Session state persistence
function saveSessionState() {
  localStorage.setItem('atlasVoice_lastSessionId', sessionId);
  localStorage.setItem('atlasVoice_lastSessionTime', new Date().toISOString());
  localStorage.setItem('atlasVoice_sessionContext', JSON.stringify({
    userId,
    sessionId,
    connectedTime: Date.now(),
    memoryLoaded: !!memoryContext
  }));
}

function getSessionContext() {
  const context = localStorage.getItem('atlasVoice_sessionContext');
  return context ? JSON.parse(context) : null;
}

// Call after connection established
dataChannel.onopen = () => {
  saveSessionState();
  // ... rest of code
};
```

**Benefit**: Can detect and resume interrupted sessions

---

## Phase 2: Smart Memory Retrieval (Week 2)

### 2.1 Load Conversation History on Connection

**File**: `sidepanel.js`

**Current** (Line 923):
```javascript
await loadMemories();
```

**Enhanced**:
```javascript
async function loadFullContext() {
  // Load long-term memories
  const memoryContext = await loadMemories();
  
  // NEW: Load recent conversation
  const conversationContext = await loadRecentConversation(sessionId);
  
  // Combine both
  const fullContext = combineContexts(memoryContext, conversationContext);
  return fullContext;
}

async function loadRecentConversation(sessionId, limit = 10) {
  try {
    const serverUrl = els.serverUrl.value.trim();
    const response = await fetch(`${serverUrl}/api/conversation/${sessionId}?limit=${limit}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) return '';
    
    const data = await response.json();
    if (!data.data || data.data.length === 0) return '';
    
    // Format as conversation context
    let context = '\n\n📋 RECENT CONVERSATION:\n';
    data.data.forEach(msg => {
      context += `${msg.role === 'user' ? 'You' : 'Atlas'}: ${msg.content}\n`;
    });
    
    return context;
  } catch (error) {
    console.error('Error loading conversation history:', error);
    return '';
  }
}

function combineContexts(memoryContext, conversationContext) {
  // Insert conversation context before AI instructions
  return conversationContext + memoryContext;
}
```

**Database**: Update `getConversationHistory()` to support limit/offset

**Backend** (`server.js`):
```javascript
app.get('/api/conversation/:sessionId', async (req, res) => {
  try {
    const userId = req.query.user_id || 'default';
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const result = await getConversationHistory(userId, sessionId, limit + offset);
    
    if (result.success) {
      const paginated = result.data.slice(offset, offset + limit);
      res.json({ data: paginated });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});
```

---

### 2.2 Implement Memory Relevance Ranking

**File**: `sidepanel.js`

**Current** (Line 639-671):
```javascript
if (data.memory && data.memory.length > 0) {
  context += '**Important Facts & Preferences:**\n';
  data.memory.slice(0, 10).forEach(m => {  // ← Just slices first 10
    context += `- [${m.memory_type}] ${m.content} ...`;
  });
}
```

**Enhanced**:
```javascript
function rankMemoriesByRelevance(memories, conversationContext = '') {
  // Calculate relevance score
  return memories.map(m => {
    // Base score: importance × access frequency
    let score = m.importance_score * Math.log(m.access_count + 1);
    
    // Boost if recent
    const daysSinceAccess = 
      (Date.now() - new Date(m.last_accessed)) / (1000 * 60 * 60 * 24);
    const recencyBoost = Math.exp(-daysSinceAccess / 30); // 30-day half-life
    score *= (1 + recencyBoost);
    
    // Boost if matches conversation topic (simple keyword matching)
    if (conversationContext && conversationContext.length > 0) {
      const contentWords = m.content.toLowerCase().split(/\s+/);
      const contextWords = conversationContext.toLowerCase().split(/\s+/);
      const matches = contentWords.filter(w => contextWords.includes(w)).length;
      if (matches > 0) score *= (1 + matches * 0.1);
    }
    
    return { ...m, relevanceScore: score };
  })
  .sort((a, b) => b.relevanceScore - a.relevanceScore)
  .slice(0, 10); // Take top 10 after ranking
}

// In loadMemories()
if (data.memory && data.memory.length > 0) {
  context += '**Important Facts & Preferences:**\n';
  const rankedMemories = rankMemoriesByRelevance(data.memory, userMessage);
  rankedMemories.forEach(m => {
    context += `- [${m.memory_type}] ${m.content} (relevance: ${m.relevanceScore.toFixed(1)})\n`;
  });
}
```

---

### 2.3 Cache Memory in localStorage

**File**: `sidepanel.js`

**Add**:
```javascript
async function loadMemories() {
  if (!els.memoryEnabled.checked) {
    console.log('💾 Memory disabled by user');
    memoryContext = '';
    return '';
  }

  // Check cache first
  const cachedMemory = localStorage.getItem('atlasVoice_memoryCache');
  const cacheTime = parseInt(localStorage.getItem('atlasVoice_memoryCacheTime') || 0);
  const cacheValid = (Date.now() - cacheTime) < (5 * 60 * 1000); // 5 min cache

  if (cachedMemory && cacheValid) {
    console.log('⚡ Using cached memory');
    memoryContext = cachedMemory;
    return memoryContext;
  }

  try {
    const serverUrl = els.serverUrl.value.trim();
    if (!serverUrl) return '';

    console.log('🧠 Loading memories from database...');
    const response = await fetch(`${serverUrl}/api/knowledge`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    // ... existing code ...

    // Cache the result
    localStorage.setItem('atlasVoice_memoryCache', context);
    localStorage.setItem('atlasVoice_memoryCacheTime', Date.now().toString());

    memoryContext = context;
    return context;
  } catch (error) {
    // Return cached if available, even if stale
    if (cachedMemory) return cachedMemory;
    return '';
  }
}

// Invalidate cache when saving new memory
async function saveConversationToDB(role, content) {
  if (!els.memoryEnabled.checked) return;

  try {
    // ... existing save code ...

    // Invalidate cache
    localStorage.removeItem('atlasVoice_memoryCache');
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}
```

---

## Phase 3: Real-Time Pattern Learning (Week 3)

### 3.1 Remove 3-Conversation Throttling

**File**: `sidepanel.js`

**Current** (Line 765-766):
```javascript
conversationCount++;
if (conversationCount % 3 !== 0) return; // ← Throttles to every 3
```

**Enhanced**:
```javascript
async function analyzeSpeechPatterns(userMessage, aiResponse) {
  if (!els.memoryEnabled.checked) return;

  try {
    const serverUrl = els.serverUrl.value.trim();
    if (!serverUrl) return;

    // NEW: Track message frequency
    let messageHistory = JSON.parse(
      localStorage.getItem('atlasVoice_messageHistory') || '[]'
    );
    messageHistory.push({
      timestamp: Date.now(),
      messageLength: userMessage.length
    });
    
    // Keep only last 100 messages
    messageHistory = messageHistory.slice(-100);
    localStorage.setItem('atlasVoice_messageHistory', JSON.stringify(messageHistory));

    const patterns = {
      response_length: analyzeResponseLength(userMessage),
      communication_style: analyzeCommunicationStyle(userMessage),
      question_style: analyzeQuestionStyle(userMessage),
      formality: analyzeFormalityLevel(userMessage),
      language_preference: analyzeLanguagePreference(userMessage),
      analyzed_at: new Date().toISOString()
    };

    // Updated confidence: based on message history consistency
    const confidence = calculateConfidenceFromHistory(messageHistory, patterns);

    await fetch(`${serverUrl}/api/pattern`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        pattern_type: 'speech_style',
        pattern_data: patterns,
        confidence_score: confidence
      })
    });

    console.log('🎭 Saved speech pattern:', patterns);
  } catch (error) {
    console.error('Error analyzing speech patterns:', error);
  }
}

function calculateConfidenceFromHistory(history, currentPatterns) {
  if (history.length < 3) return 3; // Low confidence with few samples
  
  // Calculate consistency of current patterns
  const recentMessages = history.slice(-10); // Last 10
  const avgLength = recentMessages.reduce((sum, m) => sum + m.messageLength, 0) 
    / recentMessages.length;
  
  // If current message matches average, confidence is higher
  const lastMessage = history[history.length - 1];
  const lengthDiff = Math.abs(lastMessage.messageLength - avgLength);
  const consistency = 1 - (lengthDiff / (avgLength + 1));
  
  // Base confidence on sample size + consistency
  const baseConfidence = Math.min(8, (history.length / 20) * 8); // Max 8 at 20+ samples
  return (baseConfidence * 0.7) + (consistency * 3); // Blend with consistency
}
```

---

## Phase 4: Enhanced Data Capture (Week 4)

### 4.1 Rich Metadata for Conversations

**File**: `sidepanel.js`

**Current** (Line 690-704):
```javascript
await fetch(`${serverUrl}/api/conversation`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'default',
    session_id: sessionId,
    role: role,
    content: content,
    metadata: {
      timestamp: new Date().toISOString(),
      desktop_mode: isDesktopMode,
      vision_mode: isVisionMode
    }
  })
});
```

**Enhanced**:
```javascript
async function saveConversationToDB(role, content) {
  if (!els.memoryEnabled.checked) return;

  try {
    const serverUrl = els.serverUrl.value.trim();
    if (!serverUrl) return;

    // Enhanced metadata
    const enrichedMetadata = {
      timestamp: new Date().toISOString(),
      
      // Feature context
      desktop_mode: isDesktopMode,
      vision_mode: isVisionMode,
      continuous_mode: isContinuousMode,
      
      // Message properties
      message_length: content.length,
      word_count: content.split(/\s+/).length,
      has_questions: content.includes('?'),
      
      // Session context
      time_of_day: getTimeOfDay(),
      day_of_week: new Date().getDay(),
      
      // Message classification
      intent: classifyIntent(content, role),
      sentiment: classifySentiment(content, role)
    };

    await fetch(`${serverUrl}/api/conversation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        session_id: sessionId,
        role: role,
        content: content,
        metadata: enrichedMetadata
      })
    });
  } catch (error) {
    console.error('Error saving conversation:', error);
  }
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 5) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function classifyIntent(content, role) {
  if (role === 'assistant') return 'response';
  
  const lowerContent = content.toLowerCase();
  if (lowerContent.match(/^(remember|save|keep in mind|don't forget)/)) return 'memory_request';
  if (lowerContent.includes('?')) return 'question';
  if (lowerContent.match(/^(open|click|search|find)/)) return 'command';
  if (lowerContent.match(/help|how|why|what/)) return 'inquiry';
  return 'statement';
}

function classifySentiment(content, role) {
  if (role === 'assistant') return 'neutral'; // Could add full sentiment analysis
  
  const positive = /great|good|amazing|wonderful|love|excellent|happy/i;
  const negative = /bad|terrible|hate|awful|disappointed|annoyed/i;
  
  if (positive.test(content)) return 'positive';
  if (negative.test(content)) return 'negative';
  return 'neutral';
}
```

---

## Phase 5: Memory Cleanup & Lifecycle (Week 5)

### 5.1 Add Memory Expiration Logic

**File**: `dev/server/database.js`

**Add function**:
```javascript
export async function cleanupMemory(userId, options = {}) {
  const sql = getDb();
  if (!sql) return { success: false, message: 'Database not configured' };

  const {
    maxAge = 90, // days
    minImportance = 2, // don't delete important items
    keepMinCount = 10 // keep at least this many per type
  } = options;

  try {
    // Mark old, low-importance memories for removal
    const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);
    
    await sql`
      DELETE FROM atlas_memory
      WHERE user_id = ${userId}
        AND created_at < ${cutoffDate}
        AND importance_score < ${minImportance}
        AND id NOT IN (
          SELECT id FROM atlas_memory
          WHERE user_id = ${userId}
          ORDER BY importance_score DESC, access_count DESC
          LIMIT ${keepMinCount}
        )
    `;

    // Archive old conversations (optional - just log them)
    console.log('🧹 Cleaned up old memories for user:', userId);
    return { success: true };
  } catch (error) {
    console.error('Error cleaning up memory:', error);
    return { success: false, error: error.message };
  }
}

// Call periodically (e.g., on app startup)
export async function maintenanceTask(userId) {
  console.log('Running memory maintenance...');
  await cleanupMemory(userId);
  return { success: true };
}
```

**Add endpoint** (`server.js`):
```javascript
app.post('/api/maintenance', async (req, res) => {
  try {
    const userId = req.body.user_id || 'default';
    const result = await maintenanceTask(userId);
    res.json(result);
  } catch (error) {
    console.error('Maintenance error:', error);
    res.status(500).json({ error: 'Maintenance failed' });
  }
});
```

**Call on extension startup** (`sidepanel.js`):
```javascript
// After connection established
async function triggerMaintenance() {
  try {
    const serverUrl = els.serverUrl.value.trim();
    await fetch(`${serverUrl}/api/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });
  } catch (error) {
    console.error('Error triggering maintenance:', error);
    // Non-critical, don't block
  }
}
```

---

## Implementation Priority Matrix

```
┌─────────────────────────────┬──────────────┬──────────┐
│ Feature                     │ Difficulty   │ Impact   │
├─────────────────────────────┼──────────────┼──────────┤
│ 1. User ID tracking         │ Easy         │ High     │
│ 2. Conversation history     │ Medium       │ High     │
│ 3. Memory relevance ranking │ Medium       │ High     │
│ 4. localStorage caching     │ Easy         │ Medium   │
│ 5. Real-time patterns       │ Easy         │ Medium   │
│ 6. Metadata enrichment      │ Medium       │ Medium   │
│ 7. Memory cleanup           │ Medium       │ Low      │
│ 8. Semantic search          │ Hard         │ High     │
│ 9. Autonomous learning      │ Hard         │ High     │
└─────────────────────────────┴──────────────┴──────────┘

Recommended order: 1 → 2 → 3 → 4 → 5 → 6 → 7
```

---

## Testing Strategy

### Unit Tests to Add
```javascript
// Test relevance ranking
test('rankMemoriesByRelevance sorts by importance and recency', () => {
  const memories = [
    { importance_score: 3, access_count: 1, last_accessed: today },
    { importance_score: 8, access_count: 5, last_accessed: week_ago },
  ];
  const ranked = rankMemoriesByRelevance(memories);
  expect(ranked[0].importance_score).toBe(8); // Should rank high despite age
});

// Test pattern learning
test('analyzeSpeechPatterns detects communication style', () => {
  const casual = "hey, can ya help me with this?";
  const style = analyzeCommunicationStyle(casual);
  expect(style).toContain('casual');
});

// Test session persistence
test('Session ID persists across reloads', () => {
  const { userId, sessionId } = initializeUserSession();
  const stored = localStorage.getItem('atlasVoice_userId');
  expect(stored).toBe(userId);
});
```

### Integration Tests
1. Save 10 messages, verify in database
2. Close extension, reopen, verify conversation history loads
3. Modify memory, verify cache invalidates
4. Test pattern learning every message (no throttle)
5. Verify metadata captured correctly

---

## Success Metrics

After implementation, measure:
- ✅ Memory recall accuracy (user satisfaction)
- ✅ Pattern confidence convergence (should stabilize ~5-7)
- ✅ Cache hit rate (% of memory loads from localStorage)
- ✅ Database query time (should < 100ms with new indexes)
- ✅ Cross-session continuity (% of conversations resumed)

