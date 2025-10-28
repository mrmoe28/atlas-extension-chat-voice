#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

async function createRelease() {
  try {
    // Read manifest to get version
    const manifestPath = path.join(rootDir, 'extension', 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    
    console.log(`🚀 Creating release for Atlas Voice Extension v${manifest.version}`);
    
    // Build the extension
    console.log('🏗️  Building extension...');
    const { execSync } = await import('child_process');
    execSync('npm run build:zip', { cwd: rootDir, stdio: 'inherit' });
    
    // Check if ZIP was created
    const zipPath = path.join(rootDir, 'atlas-voice-extension.zip');
    try {
      await fs.access(zipPath);
      console.log('✅ Extension ZIP created successfully!');
    } catch (error) {
      throw new Error('Failed to create extension ZIP');
    }
    
    console.log('');
    console.log('📦 Release Package Ready!');
    console.log('   File: atlas-voice-extension.zip');
    console.log(`   Version: ${manifest.version}`);
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('   1. Upload atlas-voice-extension.zip to GitHub Releases');
    console.log('   2. Create a new release with tag v' + manifest.version);
    console.log('   3. Users can download and extract the ZIP to install');
    console.log('');
    console.log('💡 Tip: Push a git tag to trigger automatic release:');
    console.log(`   git tag v${manifest.version}`);
    console.log('   git push origin v' + manifest.version);
    
  } catch (error) {
    console.error('❌ Release creation failed:', error.message);
    process.exit(1);
  }
}

createRelease();
