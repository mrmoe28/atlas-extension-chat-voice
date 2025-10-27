import { test, expect } from '@playwright/test';
import path from 'path';

test('Debug Atlas Voice Panel - Find Root Cause', async ({ page }) => {
  // Load the extension HTML directly
  const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
  await page.goto(`file://${extensionPath}`);
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Wait for JavaScript to initialize
  await page.waitForTimeout(3000);
  
  // Check console errors
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Check if voice orb wrapper exists
  const voiceOrbWrapper = page.locator('#voiceOrbWrapper');
  const exists = await voiceOrbWrapper.count() > 0;
  console.log('Voice orb wrapper exists:', exists);
  
  if (exists) {
    // Get all computed styles
    const styles = await voiceOrbWrapper.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        opacity: computed.opacity,
        visibility: computed.visibility,
        position: computed.position,
        top: computed.top,
        bottom: computed.bottom,
        left: computed.left,
        right: computed.right,
        width: computed.width,
        height: computed.height,
        zIndex: computed.zIndex,
        className: el.className,
        style: el.style.cssText,
        parentHeight: el.parentElement ? window.getComputedStyle(el.parentElement).height : 'no parent'
      };
    });
    
    console.log('Voice orb wrapper styles:', styles);
    
    // Check if it's actually visible
    const isVisible = await voiceOrbWrapper.isVisible();
    console.log('Is voice orb wrapper visible:', isVisible);
    
    // Check the actual voice orb element
    const voiceOrb = page.locator('#voiceOrb');
    const orbExists = await voiceOrb.count() > 0;
    console.log('Voice orb element exists:', orbExists);
    
    if (orbExists) {
      const orbStyles = await voiceOrb.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          width: computed.width,
          height: computed.height,
          opacity: computed.opacity,
          visibility: computed.visibility
        };
      });
      console.log('Voice orb element styles:', orbStyles);
    }
    
    // Check orb status
    const orbStatus = page.locator('#orbStatus');
    const statusExists = await orbStatus.count() > 0;
    console.log('Orb status exists:', statusExists);
    
    if (statusExists) {
      const statusText = await orbStatus.textContent();
      console.log('Orb status text:', statusText);
    }
  }
  
  // Check main content area
  const mainContent = page.locator('.main-content');
  const mainExists = await mainContent.count() > 0;
  console.log('Main content exists:', mainExists);
  
  if (mainExists) {
    const mainStyles = await mainContent.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        height: computed.height,
        minHeight: computed.minHeight,
        overflow: computed.overflow,
        position: computed.position
      };
    });
    console.log('Main content styles:', mainStyles);
  }
  
  // Check app container
  const app = page.locator('.app');
  const appExists = await app.count() > 0;
  console.log('App container exists:', appExists);
  
  if (appExists) {
    const appStyles = await app.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        height: computed.height,
        minHeight: computed.minHeight,
        flexDirection: computed.flexDirection
      };
    });
    console.log('App container styles:', appStyles);
  }
  
  // Print console logs
  console.log('Console logs:', consoleLogs);
  
  // Take a screenshot
  await page.screenshot({ path: 'debug-atlas-panel.png', fullPage: true });
});
