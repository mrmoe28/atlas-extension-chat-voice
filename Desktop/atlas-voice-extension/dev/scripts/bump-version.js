#!/usr/bin/env node

/**
 * Version Bump Script
 * Automatically bumps version in manifest.json and package.json
 * Usage: npm run bump [major|minor|patch]
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../..');

const manifestPath = path.join(rootDir, 'manifest.json');
const packagePath = path.join(rootDir, 'package.json');

function parseVersion(version) {
  const parts = version.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0
  };
}

function bumpVersion(version, type = 'patch') {
  const { major, minor, patch } = parseVersion(version);

  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

async function updateFile(filePath, newVersion) {
  const content = await fs.readFile(filePath, 'utf8');
  const json = JSON.parse(content);
  const oldVersion = json.version;

  json.version = newVersion;

  await fs.writeFile(filePath, JSON.stringify(json, null, 2) + '\n');

  return { oldVersion, newVersion };
}

async function main() {
  try {
    const bumpType = process.argv[2] || 'patch';

    if (!['major', 'minor', 'patch'].includes(bumpType)) {
      console.error('❌ Invalid bump type. Use: major, minor, or patch');
      process.exit(1);
    }

    // Read current version from manifest
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    const currentVersion = manifest.version;
    const newVersion = bumpVersion(currentVersion, bumpType);

    console.log('🔄 Bumping version...');
    console.log(`   Type: ${bumpType}`);
    console.log(`   Current: ${currentVersion}`);
    console.log(`   New: ${newVersion}`);

    // Update manifest.json
    const manifestResult = await updateFile(manifestPath, newVersion);
    console.log(`   ✅ Updated manifest.json`);

    // Update package.json
    const packageResult = await updateFile(packagePath, newVersion);
    console.log(`   ✅ Updated package.json`);

    console.log('');
    console.log('✨ Version bumped successfully!');
    console.log('');
    console.log('🎯 Next steps:');
    console.log(`   1. Review changes: git diff`);
    console.log(`   2. Commit: git add . && git commit -m "chore: bump version to v${newVersion}"`);
    console.log(`   3. Tag: git tag v${newVersion}`);
    console.log(`   4. Push: git push origin main --tags`);
    console.log('');
    console.log('💡 The GitHub Action will automatically create a release!');

  } catch (error) {
    console.error('❌ Version bump failed:', error.message);
    process.exit(1);
  }
}

main();
