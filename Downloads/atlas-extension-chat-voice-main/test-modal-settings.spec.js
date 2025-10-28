import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Atlas Voice Modal Settings Tests', () => {
  test('Settings modal opens and closes correctly', async ({ page }) => {
    // Load the extension HTML directly
    const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
    await page.goto(`file://${extensionPath}`);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check voice orb is initially visible
    const voiceOrbWrapper = page.locator('#voiceOrbWrapper');
    await expect(voiceOrbWrapper).toBeVisible();
    
    // Check settings modal is initially hidden
    const settingsModal = page.locator('#settingsModal');
    await expect(settingsModal).not.toHaveClass(/open/);
    
    // Click hamburger menu to open settings modal
    const menuBtn = page.locator('#menuBtn');
    await menuBtn.click();
    
    // Check settings modal is open
    await expect(settingsModal).toHaveClass(/open/);
    
    // Check voice orb is still visible (not covered by modal)
    await expect(voiceOrbWrapper).toBeVisible();
    
    // Check modal backdrop is visible
    const settingsBackdrop = page.locator('#settingsBackdrop');
    await expect(settingsBackdrop).toBeVisible();
    
    // Check modal content is visible
    const settingsContent = page.locator('.settings-content');
    await expect(settingsContent).toBeVisible();
    
    // Click close button to close modal
    const settingsClose = page.locator('#settingsClose');
    await settingsClose.click();
    
    // Check settings modal is closed
    await expect(settingsModal).not.toHaveClass(/open/);
    
    // Check voice orb is still visible
    await expect(voiceOrbWrapper).toBeVisible();
  });

  test('Settings modal closes when clicking backdrop', async ({ page }) => {
    // Load the extension HTML directly
    const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
    await page.goto(`file://${extensionPath}`);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Open settings modal
    const menuBtn = page.locator('#menuBtn');
    await menuBtn.click();
    
    const settingsModal = page.locator('#settingsModal');
    await expect(settingsModal).toHaveClass(/open/);
    
    // Click backdrop to close modal
    const settingsBackdrop = page.locator('#settingsBackdrop');
    await settingsBackdrop.click();
    
    // Check settings modal is closed
    await expect(settingsModal).not.toHaveClass(/open/);
  });

  test('Settings modal closes with Escape key', async ({ page }) => {
    // Load the extension HTML directly
    const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
    await page.goto(`file://${extensionPath}`);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Open settings modal
    const menuBtn = page.locator('#menuBtn');
    await menuBtn.click();
    
    const settingsModal = page.locator('#settingsModal');
    await expect(settingsModal).toHaveClass(/open/);
    
    // Press Escape key to close modal
    await page.keyboard.press('Escape');
    
    // Check settings modal is closed
    await expect(settingsModal).not.toHaveClass(/open/);
  });

  test('Voice orb remains visible and functional with modal', async ({ page }) => {
    // Load the extension HTML directly
    const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
    await page.goto(`file://${extensionPath}`);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check voice orb is initially visible
    const voiceOrbWrapper = page.locator('#voiceOrbWrapper');
    await expect(voiceOrbWrapper).toBeVisible();
    
    // Open settings modal
    const menuBtn = page.locator('#menuBtn');
    await menuBtn.click();
    
    // Check voice orb is still visible when modal is open
    await expect(voiceOrbWrapper).toBeVisible();
    
    // Check voice orb z-index is lower than modal (orb should be behind modal)
    const orbStyles = await voiceOrbWrapper.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        zIndex: styles.zIndex,
        position: styles.position
      };
    });
    
    const modalStyles = await page.locator('#settingsModal').evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        zIndex: styles.zIndex,
        position: styles.position
      };
    });
    
    console.log('Voice orb z-index:', orbStyles.zIndex);
    console.log('Modal z-index:', modalStyles.zIndex);
    
    // Modal should have higher z-index than orb
    expect(parseInt(modalStyles.zIndex)).toBeGreaterThan(parseInt(orbStyles.zIndex));
  });
});
