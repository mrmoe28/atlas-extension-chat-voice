import { test, expect } from '@playwright/test';
import path from 'path';

test('Debug voice orb visibility', async ({ page }) => {
  // Load the extension HTML directly
  const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
  await page.goto(`file://${extensionPath}`);
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  
  // Wait a bit for JavaScript to initialize
  await page.waitForTimeout(2000);
  
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
        style: el.style.cssText
      };
    });
    
    console.log('Voice orb wrapper styles:', styles);
    
    // Check if it's actually visible
    const isVisible = await voiceOrbWrapper.isVisible();
    console.log('Is voice orb wrapper visible:', isVisible);
    
    // Check parent elements
    const mainContent = page.locator('.main-content');
    const mainContentStyles = await mainContent.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        height: computed.height,
        overflow: computed.overflow,
        position: computed.position
      };
    });
    
    console.log('Main content styles:', mainContentStyles);
    
    // Check if there are any overlapping elements
    const overlappingElements = await page.evaluate(() => {
      const orb = document.getElementById('voiceOrbWrapper');
      if (!orb) return [];
      
      const rect = orb.getBoundingClientRect();
      const elements = document.elementsFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
      return elements.map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        zIndex: window.getComputedStyle(el).zIndex
      }));
    });
    
    console.log('Elements overlapping voice orb:', overlappingElements);
  }
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-voice-orb.png', fullPage: true });
});
