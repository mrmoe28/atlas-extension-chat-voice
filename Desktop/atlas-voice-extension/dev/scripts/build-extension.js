#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { minify as terserMinify } from 'terser';
import CleanCSS from 'clean-css';
import { minify as htmlMinify } from 'html-minifier-terser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '../..');
const extensionDir = rootDir; // Extension files are now at root
const distDir = path.join(__dirname, '../build-tools/dist');

console.log('🏗️  Building Chrome Extension...');

async function copyDirectory(src, dest, isRoot = true) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  // Extension files to include (only filter at root level)
  const extensionFiles = [
    'manifest.json',
    'background.js',
    'content.js',
    'sidepanel.html',
    'sidepanel.js',
    'styles.css',
    'assets',
    'lib'
  ];

  // Files and directories to always exclude
  const excludePatterns = [
    '__tests__',
    '.test.js',
    '.spec.js',
    'test.js',
    '.test.ts',
    '.spec.ts'
  ];

  for (const entry of entries) {
    // Skip test files and directories
    const shouldExclude = excludePatterns.some(pattern =>
      entry.name.includes(pattern) || entry.name.endsWith(pattern)
    );

    if (shouldExclude) {
      continue;
    }

    // Only filter at root level
    if (isRoot && !extensionFiles.includes(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath, false);
    } else {
      await fs.copyFile(srcPath, destPath);
      console.log(`   ✅ Copied: ${entry.name}`);
    }
  }
}

async function minifyJavaScript(filePath) {
  try {
    const code = await fs.readFile(filePath, 'utf8');
    const result = await terserMinify(code, {
      compress: {
        dead_code: true,
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true,
        pure_funcs: []
      },
      mangle: {
        toplevel: false
      },
      format: {
        comments: false
      }
    });

    if (result.code) {
      await fs.writeFile(filePath, result.code, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`   ⚠️  Could not minify ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

async function minifyCSS(filePath) {
  try {
    const css = await fs.readFile(filePath, 'utf8');
    const cleanCSS = new CleanCSS({
      level: 2,
      compatibility: 'ie9'
    });
    const result = cleanCSS.minify(css);

    if (!result.errors.length) {
      await fs.writeFile(filePath, result.styles, 'utf8');
      return true;
    } else {
      console.warn(`   ⚠️  CSS minification errors: ${result.errors.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.warn(`   ⚠️  Could not minify ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

async function minifyHTML(filePath) {
  try {
    const html = await fs.readFile(filePath, 'utf8');
    const result = await htmlMinify(html, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      minifyCSS: true,
      minifyJS: true
    });

    await fs.writeFile(filePath, result, 'utf8');
    return true;
  } catch (error) {
    console.warn(`   ⚠️  Could not minify ${path.basename(filePath)}: ${error.message}`);
    return false;
  }
}

async function minifyDistFiles() {
  console.log('🗜️  Minifying files...');
  const jsFiles = ['sidepanel.js', 'background.js', 'content.js'];
  const cssFiles = ['styles.css'];
  const htmlFiles = ['sidepanel.html'];

  let jsMinified = 0, cssMinified = 0, htmlMinified = 0;

  // Minify JavaScript files
  for (const file of jsFiles) {
    const filePath = path.join(distDir, file);
    try {
      await fs.access(filePath);
      if (await minifyJavaScript(filePath)) {
        jsMinified++;
        console.log(`   ✅ Minified JS: ${file}`);
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  }

  // Minify CSS files
  for (const file of cssFiles) {
    const filePath = path.join(distDir, file);
    try {
      await fs.access(filePath);
      if (await minifyCSS(filePath)) {
        cssMinified++;
        console.log(`   ✅ Minified CSS: ${file}`);
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  }

  // Minify HTML files
  for (const file of htmlFiles) {
    const filePath = path.join(distDir, file);
    try {
      await fs.access(filePath);
      if (await minifyHTML(filePath)) {
        htmlMinified++;
        console.log(`   ✅ Minified HTML: ${file}`);
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  }

  // Minify lib/ JavaScript files recursively
  const libDir = path.join(distDir, 'lib');
  try {
    await fs.access(libDir);
    const libFiles = await fs.readdir(libDir);
    for (const file of libFiles) {
      if (file.endsWith('.js')) {
        const filePath = path.join(libDir, file);
        if (await minifyJavaScript(filePath)) {
          jsMinified++;
          console.log(`   ✅ Minified JS: lib/${file}`);
        }
      }
    }
  } catch (error) {
    // lib directory doesn't exist or is empty
  }

  console.log(`   📊 Minified: ${jsMinified} JS, ${cssMinified} CSS, ${htmlMinified} HTML files`);
}

async function build() {
  try {
    // Clean dist directory
    console.log('🧹 Cleaning dist directory...');
    await fs.rm(distDir, { recursive: true, force: true });
    
    // Copy extension files
    console.log('📁 Copying extension files...');
    await copyDirectory(extensionDir, distDir);

    // Minify files
    await minifyDistFiles();

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
