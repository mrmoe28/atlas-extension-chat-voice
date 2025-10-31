/**
 * Migration: Create piper_voices table and insert downloaded voices
 */
import 'dotenv/config';
import { getDb } from './database.js';

const voices = [
  {
    name: 'lessac',
    display_name: 'Lessac (Male)',
    model_file: 'en_US-lessac-medium.onnx',
    language: 'en_US',
    gender: 'male',
    quality: 'medium',
    file_size_mb: 60,
    description: 'Clear, natural male voice. Good balance of quality and speed.',
    local_path: '/Users/ekodevapps/Desktop/atlas-voice-extension/piper-tts/voices/en_US-lessac-medium.onnx'
  },
  {
    name: 'amy',
    display_name: 'Amy (Female)',
    model_file: 'en_US-amy-medium.onnx',
    language: 'en_US',
    gender: 'female',
    quality: 'medium',
    file_size_mb: 60,
    description: 'Warm, friendly female voice. Excellent for conversational use.',
    local_path: '/Users/ekodevapps/Desktop/atlas-voice-extension/piper-tts/voices/en_US-amy-medium.onnx'
  },
  {
    name: 'ljspeech',
    display_name: 'LJSpeech (Female - Best)',
    model_file: 'en_US-ljspeech-high.onnx',
    language: 'en_US',
    gender: 'female',
    quality: 'high',
    file_size_mb: 109,
    description: 'Highest quality female voice. Most natural sounding, recommended for Atlas.',
    local_path: '/Users/ekodevapps/Desktop/atlas-voice-extension/piper-tts/voices/en_US-ljspeech-high.onnx'
  },
  {
    name: 'ryan',
    display_name: 'Ryan (Male - Best)',
    model_file: 'en_US-ryan-high.onnx',
    language: 'en_US',
    gender: 'male',
    quality: 'high',
    file_size_mb: 91,
    description: 'Highest quality male voice. Most natural sounding, recommended for Atlas.',
    local_path: '/Users/ekodevapps/Desktop/atlas-voice-extension/piper-tts/voices/en_US-ryan-high.onnx'
  },
  {
    name: 'danny',
    display_name: 'Danny (Male - Fast)',
    model_file: 'en_US-danny-low.onnx',
    language: 'en_US',
    gender: 'male',
    quality: 'low',
    file_size_mb: 38,
    description: 'Lightweight male voice. Fastest inference, good for quick responses.',
    local_path: '/Users/ekodevapps/Desktop/atlas-voice-extension/piper-tts/voices/en_US-danny-low.onnx'
  },
  {
    name: 'kathleen',
    display_name: 'Kathleen (Female - Fast)',
    model_file: 'en_US-kathleen-low.onnx',
    language: 'en_US',
    gender: 'female',
    quality: 'low',
    file_size_mb: 33,
    description: 'Lightweight female voice. Fastest inference, good for quick responses.',
    local_path: '/Users/ekodevapps/Desktop/atlas-voice-extension/piper-tts/voices/en_US-kathleen-low.onnx'
  }
];

async function migrate() {
  console.log('🗄️  Starting Piper Voices migration...\n');

  const sql = getDb();
  if (!sql) {
    console.error('❌ Database connection failed. Check DATABASE_URL env variable.');
    process.exit(1);
  }

  try {
    // Create table
    console.log('📋 Creating piper_voices table...');
    await sql`
      CREATE TABLE IF NOT EXISTS piper_voices (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        model_file VARCHAR(255) NOT NULL,
        language VARCHAR(20) NOT NULL DEFAULT 'en_US',
        gender VARCHAR(20),
        quality VARCHAR(20),
        file_size_mb INTEGER,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        local_path TEXT,
        sample_text TEXT DEFAULT 'Hello! I am Atlas, your voice assistant.',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    console.log('✅ Table created\n');

    // Create indexes
    console.log('🔍 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_piper_voices_active ON piper_voices(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_piper_voices_quality ON piper_voices(quality)`;
    console.log('✅ Indexes created\n');

    // Insert voices
    console.log('🎤 Inserting voices...');
    for (const voice of voices) {
      try {
        await sql`
          INSERT INTO piper_voices (
            name, display_name, model_file, language, gender,
            quality, file_size_mb, description, local_path
          ) VALUES (
            ${voice.name}, ${voice.display_name}, ${voice.model_file},
            ${voice.language}, ${voice.gender}, ${voice.quality},
            ${voice.file_size_mb}, ${voice.description}, ${voice.local_path}
          )
          ON CONFLICT (name) DO UPDATE SET
            display_name = ${voice.display_name},
            description = ${voice.description},
            is_active = true,
            updated_at = NOW()
        `;
        console.log(`   ✅ ${voice.display_name}`);
      } catch (err) {
        console.error(`   ❌ Failed to insert ${voice.name}:`, err.message);
      }
    }

    console.log('\n✅ Migration complete!');
    console.log('\n📊 Voice Summary:');
    const result = await sql`SELECT name, display_name, quality, gender FROM piper_voices ORDER BY quality DESC, name`;
    result.forEach(v => {
      console.log(`   • ${v.display_name} (${v.quality})`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
