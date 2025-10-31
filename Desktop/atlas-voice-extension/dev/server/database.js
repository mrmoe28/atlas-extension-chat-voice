import { neon } from '@neondatabase/serverless';

// Get database URL from environment
const getDatabaseUrl = () => {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
};

// Initialize database connection
export const getDb = () => {
  const dbUrl = getDatabaseUrl();
  if (!dbUrl) {
    console.warn('⚠️  No database URL configured. Memory features will be disabled.');
    return null;
  }
  return neon(dbUrl);
};

// Database schema
export const schema = `
-- Atlas Memory Table
CREATE TABLE IF NOT EXISTS atlas_memory (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL DEFAULT 'default',
  memory_type VARCHAR(50) NOT NULL, -- 'fact', 'preference', 'context', 'instruction'
  content TEXT NOT NULL,
  importance_score INTEGER DEFAULT 5, -- 1-10 scale
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP DEFAULT NOW()
);

-- Atlas Conversations Table
CREATE TABLE IF NOT EXISTS atlas_conversations (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL DEFAULT 'default',
  session_id VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Piper TTS Voices Table
CREATE TABLE IF NOT EXISTS piper_voices (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE, -- 'lessac', 'ryan', etc.
  display_name VARCHAR(255) NOT NULL,
  model_file VARCHAR(255) NOT NULL,
  language VARCHAR(20) NOT NULL DEFAULT 'en_US',
  gender VARCHAR(20), -- 'male', 'female'
  quality VARCHAR(20), -- 'low', 'medium', 'high'
  file_size_mb INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  local_path TEXT, -- Path on server filesystem
  sample_text TEXT DEFAULT 'Hello! I am Atlas, your voice assistant.',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_piper_voices_active ON piper_voices(is_active);
CREATE INDEX IF NOT EXISTS idx_piper_voices_quality ON piper_voices(quality);

-- Atlas Learned Patterns Table
CREATE TABLE IF NOT EXISTS atlas_patterns (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL DEFAULT 'default',
  pattern_type VARCHAR(50) NOT NULL, -- 'command', 'workflow', 'preference'
  pattern_data JSONB NOT NULL,
  confidence_score FLOAT DEFAULT 0.5,
  frequency INTEGER DEFAULT 1,
  last_used TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Atlas Knowledge Base Table
CREATE TABLE IF NOT EXISTS atlas_knowledge (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL DEFAULT 'default',
  category VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_memory_user ON atlas_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_type ON atlas_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_memory_importance ON atlas_memory(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON atlas_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_patterns_user ON atlas_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_user ON atlas_knowledge(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON atlas_knowledge(category);
`;

// Initialize database tables
export async function initializeDatabase() {
  const sql = getDb();
  if (!sql) {
    console.log('📦 Database not configured - skipping initialization');
    return { success: false, message: 'Database not configured' };
  }

  try {
    console.log('🗄️  Initializing Atlas database schema...');
    // Use neon's approach: execute each statement separately
    await sql`
      CREATE TABLE IF NOT EXISTS atlas_memory (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL DEFAULT 'default',
        memory_type VARCHAR(50) NOT NULL,
        content TEXT NOT NULL,
        importance_score INTEGER DEFAULT 5,
        access_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        last_accessed TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS atlas_conversations (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL DEFAULT 'default',
        session_id VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS atlas_patterns (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL DEFAULT 'default',
        pattern_type VARCHAR(50) NOT NULL,
        pattern_data JSONB NOT NULL,
        confidence_score FLOAT DEFAULT 0.5,
        frequency INTEGER DEFAULT 1,
        last_used TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS atlas_knowledge (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL DEFAULT 'default',
        category VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        tags TEXT[] DEFAULT '{}',
        access_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_memory_user ON atlas_memory(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_memory_type ON atlas_memory(memory_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_memory_importance ON atlas_memory(importance_score DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_conversations_session ON atlas_conversations(session_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_patterns_user ON atlas_patterns(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_knowledge_user ON atlas_knowledge(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_knowledge_category ON atlas_knowledge(category)`;

    console.log('✅ Database schema initialized successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    return { success: false, error: error.message };
  }
}

// Memory Operations
export async function saveMemory(userId, memoryType, content, importanceScore = 5) {
  const sql = getDb();
  if (!sql) return { success: false, message: 'Database not configured' };

  try {
    const result = await sql`
      INSERT INTO atlas_memory (user_id, memory_type, content, importance_score)
      VALUES (${userId}, ${memoryType}, ${content}, ${importanceScore})
      RETURNING *
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Error saving memory:', error);
    return { success: false, error: error.message };
  }
}

export async function getMemories(userId, limit = 20) {
  const sql = getDb();
  if (!sql) return { success: false, message: 'Database not configured' };

  try {
    const memories = await sql`
      SELECT * FROM atlas_memory
      WHERE user_id = ${userId}
      ORDER BY importance_score DESC, last_accessed DESC
      LIMIT ${limit}
    `;
    return { success: true, data: memories };
  } catch (error) {
    console.error('Error getting memories:', error);
    return { success: false, error: error.message };
  }
}

export async function updateMemoryAccess(memoryId) {
  const sql = getDb();
  if (!sql) return { success: false, message: 'Database not configured' };

  try {
    await sql`
      UPDATE atlas_memory
      SET access_count = access_count + 1,
          last_accessed = NOW()
      WHERE id = ${memoryId}
    `;
    return { success: true };
  } catch (error) {
    console.error('Error updating memory access:', error);
    return { success: false, error: error.message };
  }
}

// Conversation Operations
export async function saveConversation(userId, sessionId, role, content, metadata = {}) {
  const sql = getDb();
  if (!sql) return { success: false, message: 'Database not configured' };

  try {
    const result = await sql`
      INSERT INTO atlas_conversations (user_id, session_id, role, content, metadata)
      VALUES (${userId}, ${sessionId}, ${role}, ${content}, ${JSON.stringify(metadata)})
      RETURNING *
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Error saving conversation:', error);
    return { success: false, error: error.message };
  }
}

export async function getConversationHistory(userId, sessionId, limit = 50) {
  const sql = getDb();
  if (!sql) return { success: false, message: 'Database not configured' };

  try {
    const conversations = await sql`
      SELECT * FROM atlas_conversations
      WHERE user_id = ${userId} AND session_id = ${sessionId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return { success: true, data: conversations.reverse() };
  } catch (error) {
    console.error('Error getting conversation history:', error);
    return { success: false, error: error.message };
  }
}

// Pattern Operations
export async function savePattern(userId, patternType, patternData, confidenceScore = 0.5) {
  const sql = getDb();
  if (!sql) return { success: false, message: 'Database not configured' };

  try {
    const result = await sql`
      INSERT INTO atlas_patterns (user_id, pattern_type, pattern_data, confidence_score)
      VALUES (${userId}, ${patternType}, ${JSON.stringify(patternData)}, ${confidenceScore})
      RETURNING *
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Error saving pattern:', error);
    return { success: false, error: error.message };
  }
}

export async function getPatterns(userId, patternType = null) {
  const sql = getDb();
  if (!sql) return { success: false, message: 'Database not configured' };

  try {
    let patterns;
    if (patternType) {
      patterns = await sql`
        SELECT * FROM atlas_patterns
        WHERE user_id = ${userId} AND pattern_type = ${patternType}
        ORDER BY frequency DESC, confidence_score DESC
      `;
    } else {
      patterns = await sql`
        SELECT * FROM atlas_patterns
        WHERE user_id = ${userId}
        ORDER BY frequency DESC, confidence_score DESC
      `;
    }
    return { success: true, data: patterns };
  } catch (error) {
    console.error('Error getting patterns:', error);
    return { success: false, error: error.message };
  }
}

// Knowledge Base Operations
export async function saveKnowledge(userId, category, title, content, tags = []) {
  const sql = getDb();
  if (!sql) return { success: false, message: 'Database not configured' };

  try {
    const result = await sql`
      INSERT INTO atlas_knowledge (user_id, category, title, content, tags)
      VALUES (${userId}, ${category}, ${title}, ${content}, ${tags})
      RETURNING *
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error('Error saving knowledge:', error);
    return { success: false, error: error.message };
  }
}

export async function getKnowledge(userId, category = null) {
  const sql = getDb();
  if (!sql) return { success: false, message: 'Database not configured' };

  try {
    let knowledge;
    if (category) {
      knowledge = await sql`
        SELECT * FROM atlas_knowledge
        WHERE user_id = ${userId} AND category = ${category}
        ORDER BY access_count DESC, updated_at DESC
      `;
    } else {
      knowledge = await sql`
        SELECT * FROM atlas_knowledge
        WHERE user_id = ${userId}
        ORDER BY access_count DESC, updated_at DESC
      `;
    }
    return { success: true, data: knowledge };
  } catch (error) {
    console.error('Error getting knowledge:', error);
    return { success: false, error: error.message };
  }
}

export async function clearAllMemory(userId) {
  const sql = getDb();
  if (!sql) return { success: false, message: 'Database not configured' };

  try {
    await sql`DELETE FROM atlas_memory WHERE user_id = ${userId}`;
    await sql`DELETE FROM atlas_conversations WHERE user_id = ${userId}`;
    await sql`DELETE FROM atlas_patterns WHERE user_id = ${userId}`;
    return { success: true };
  } catch (error) {
    console.error('Error clearing memory:', error);
    return { success: false, error: error.message };
  }
}
