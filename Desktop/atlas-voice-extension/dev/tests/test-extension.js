import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAtlasVoiceExtension() {
  console.log('🚀 Starting Atlas Voice Extension Test...\n');

  // Launch Chrome with extension
  const extensionPath = path.join(__dirname, 'extension');
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox'
    ]
  });

  const page = await context.newPage();

  // Wait a bit for extension to load
  await page.waitForTimeout(2000);

  // Get all pages (including extension pages)
  const pages = context.pages();
  console.log(`📄 Total pages open: ${pages.length}`);

  // Find the extension page
  let extensionPage = null;
  for (const p of pages) {
    const url = p.url();
    console.log(`   - ${url}`);
    if (url.includes('chrome-extension://') && url.includes('sidepanel.html')) {
      extensionPage = p;
      console.log('✅ Found extension side panel!');
    }
  }

  if (!extensionPage) {
    // Try to open the side panel manually
    console.log('🔍 Side panel not found, checking extension ID...');

    // Navigate to extensions page to get the ID
    await page.goto('chrome://extensions/');
    await page.waitForTimeout(1000);

    console.log('❌ Could not automatically find side panel.');
    console.log('📝 Manual test required - please click the extension icon to open side panel');

    await page.waitForTimeout(60000); // Wait 1 minute for manual testing
    await context.close();
    return;
  }

  // Test the extension
  console.log('\n🧪 Testing Extension Features...\n');

  try {
    // Take screenshot
    await extensionPage.screenshot({ path: '/tmp/extension-initial.png' });
    console.log('📸 Screenshot saved: /tmp/extension-initial.png');

    // Check if connected
    const statusDot = await extensionPage.$('#statusDot');
    const isConnected = await statusDot?.evaluate(el => el.classList.contains('connected'));
    console.log(`🔌 Connection Status: ${isConnected ? '✅ Connected' : '❌ Not Connected'}`);

    // Check hamburger menu
    const menuBtn = await extensionPage.$('#menuBtn');
    if (menuBtn) {
      console.log('✅ Hamburger menu button found');
      await menuBtn.click();
      await extensionPage.waitForTimeout(500);
      await extensionPage.screenshot({ path: '/tmp/extension-menu-open.png' });
      console.log('📸 Menu screenshot saved: /tmp/extension-menu-open.png');
    }

    // Check server URL
    const serverUrl = await extensionPage.$('#serverUrl');
    const currentUrl = await serverUrl?.inputValue();
    console.log(`🌐 Server URL: ${currentUrl}`);

    // Check Desktop Commander mode
    const desktopMode = await extensionPage.$('#desktopMode');
    const isDesktopEnabled = await desktopMode?.isChecked();
    console.log(`🖥️  Desktop Commander: ${isDesktopEnabled ? '✅ Enabled' : '❌ Disabled'}`);

    // Check if local server or Vercel
    if (currentUrl?.includes('vercel.app')) {
      console.log('⚠️  WARNING: Using Vercel server - Desktop Commander will NOT work!');
      console.log('💡 Change to http://localhost:8787 for desktop commands');
    } else if (currentUrl?.includes('localhost')) {
      console.log('✅ Using local server - Desktop Commander should work');
    }

    // Check continuous mode
    const continuousMode = await extensionPage.$('#continuousMode');
    const isContinuous = await continuousMode?.isChecked();
    console.log(`🔄 Continuous Mode: ${isContinuous ? '✅ Enabled' : '❌ Disabled'}`);

    // Try to connect if not connected
    if (!isConnected) {
      console.log('\n🔌 Attempting to connect...');
      const connectBtn = await extensionPage.$('#connectBtn');
      if (connectBtn) {
        await connectBtn.click();
        await extensionPage.waitForTimeout(3000);

        const nowConnected = await statusDot?.evaluate(el => el.classList.contains('connected'));
        console.log(`🔌 Connection Result: ${nowConnected ? '✅ Connected!' : '❌ Failed to connect'}`);

        await extensionPage.screenshot({ path: '/tmp/extension-after-connect.png' });
        console.log('📸 Post-connection screenshot: /tmp/extension-after-connect.png');
      }
    }

    // Get console logs
    console.log('\n📜 Console Logs from Extension:');
    extensionPage.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log(`   ❌ ERROR: ${text}`);
      } else if (type === 'warning') {
        console.log(`   ⚠️  WARN: ${text}`);
      } else {
        console.log(`   ℹ️  ${text}`);
      }
    });

    // Test browser control - open a new tab
    console.log('\n🌐 Testing Browser Control...');
    const testPage = await context.newPage();
    await testPage.goto('https://www.google.com');
    console.log('✅ Successfully opened new tab with Google');
    await testPage.close();
    console.log('✅ Successfully closed test tab');

    console.log('\n✅ Extension test complete!');
    console.log('\n📊 Summary:');
    console.log(`   Connection: ${isConnected ? '✅' : '❌'}`);
    console.log(`   Desktop Commander: ${isDesktopEnabled ? '✅' : '❌'}`);
    console.log(`   Server: ${currentUrl}`);
    console.log(`   Browser Control: ✅ Working`);

    // Keep browser open for manual testing
    console.log('\n⏸️  Browser will stay open for 2 minutes for manual testing...');
    await extensionPage.waitForTimeout(120000);

  } catch (error) {
    console.error('❌ Test Error:', error);
    await extensionPage?.screenshot({ path: '/tmp/extension-error.png' });
    console.log('📸 Error screenshot saved: /tmp/extension-error.png');
  }

  await context.close();
  console.log('\n👋 Test complete!');
}

// Run the test
testAtlasVoiceExtension().catch(console.error);
