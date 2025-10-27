import { test, expect } from '@playwright/test';
import path from 'path';

test('Test Settings Dropdown Bottom Positioning', async ({ page }) => {
  // Load the extension HTML directly
  const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
  await page.goto(`file://${extensionPath}`);
  
  // Wait for the page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Check voice orb is initially visible
  const voiceOrbWrapper = page.locator('#voiceOrbWrapper');
  await expect(voiceOrbWrapper).toBeVisible();
  
  // Check settings dropdown initial state
  const settingsDropdown = page.locator('#settingsDropdown');
  const initialPosition = await settingsDropdown.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      position: styles.position,
      bottom: styles.bottom,
      top: styles.top,
      maxHeight: styles.maxHeight
    };
  });
  
  console.log('Settings dropdown initial position:', initialPosition);
  expect(initialPosition.position).toBe('fixed');
  expect(initialPosition.bottom).toBe('0px');
  expect(initialPosition.maxHeight).toBe('0px');
  
  // Click hamburger menu to open settings
  const menuBtn = page.locator('#menuBtn');
  await menuBtn.click();
  
  // Check settings dropdown is open
  await expect(settingsDropdown).toHaveClass(/open/);
  
  // Check voice orb is still visible when settings are open
  await expect(voiceOrbWrapper).toBeVisible();
  
  // Check settings dropdown open position
  const openPosition = await settingsDropdown.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      position: styles.position,
      bottom: styles.bottom,
      top: styles.top,
      maxHeight: styles.maxHeight,
      height: styles.height
    };
  });
  
  console.log('Settings dropdown open position:', openPosition);
  expect(openPosition.position).toBe('fixed');
  expect(openPosition.bottom).toBe('0px');
  expect(openPosition.maxHeight).toBe('40vh');
  
  // Check that voice orb is not hidden
  const orbClasses = await voiceOrbWrapper.getAttribute('class');
  expect(orbClasses).not.toContain('hidden');
  
  // Check voice orb is still properly positioned
  const orbPosition = await voiceOrbWrapper.evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      bottom: styles.bottom,
      height: styles.height
    };
  });
  
  console.log('Voice orb position when settings open:', orbPosition);
  expect(orbPosition.bottom).toBe('80px');
  
  // Click menu button again to close settings
  await menuBtn.click();
  
  // Check settings dropdown is closed
  await expect(settingsDropdown).not.toHaveClass(/open/);
  
  // Check voice orb is still visible
  await expect(voiceOrbWrapper).toBeVisible();
  
  // Take a screenshot
  await page.screenshot({ path: 'settings-bottom-position.png', fullPage: true });
});
