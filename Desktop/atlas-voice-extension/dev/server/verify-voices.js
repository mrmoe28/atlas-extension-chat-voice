/**
 * Verify Piper voices in database
 */
import 'dotenv/config';
import { getDb } from './database.js';

async function verify() {
  console.log('🔍 Querying Piper voices from database...\n');

  const sql = getDb();
  if (!sql) {
    console.error('❌ Database connection failed.');
    process.exit(1);
  }

  try {
    const voices = await sql`
      SELECT id, name, display_name, quality, gender, file_size_mb, is_active
      FROM piper_voices
      ORDER BY quality DESC, name
    `;

    console.log(`✅ Found ${voices.length} voices:\n`);

    voices.forEach(v => {
      console.log(`   ${v.id}. ${v.display_name}`);
      console.log(`      Quality: ${v.quality} | Gender: ${v.gender} | Size: ${v.file_size_mb}MB`);
      console.log(`      Active: ${v.is_active}\n`);
    });

    // Get count by quality
    const stats = await sql`
      SELECT quality, COUNT(*) as count
      FROM piper_voices
      GROUP BY quality
      ORDER BY quality DESC
    `;

    console.log('📊 Statistics:');
    stats.forEach(s => {
      console.log(`   ${s.quality}: ${s.count} voices`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verify();
