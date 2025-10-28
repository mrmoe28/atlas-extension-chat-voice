#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const extensionDir = path.join(rootDir, 'extension');
const distDir = path.join(rootDir, 'dist');

console.log('🏗️  Building Chrome Extension...');

async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
      console.log(`   ✅ Copied: ${entry.name}`);
    }
  }
}

async function build() {
  try {
    // Clean dist directory
    console.log('🧹 Cleaning dist directory...');
    await fs.rm(distDir, { recursive: true, force: true });
    
    // Copy extension files
    console.log('📁 Copying extension files...');
    await copyDirectory(extensionDir, distDir);
    
    // Verify manifest exists
    const manifestPath = path.join(distDir, 'manifest.json');
    try {
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      console.log(`✅ Extension built successfully!`);
      console.log(`   📦 Name: ${manifest.name}`);
      console.log(`   🏷️  Version: ${manifest.version}`);
      console.log(`   📂 Output: dist/`);
    } catch (error) {
      throw new Error('Invalid manifest.json in extension directory');
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();
