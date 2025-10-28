import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Atlas Voice Independent Settings Modal Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Load the extension HTML directly
    const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
    await page.goto(`file://${extensionPath}`);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('Voice orb is visible and functional when modal is closed', async ({ page }) => {
    // Check voice orb is initially visible
    const voiceOrbWrapper = page.locator('#voiceOrbWrapper');
    await expect(voiceOrbWrapper).toBeVisible();
    
    // Check voice orb z-index is appropriate
    const orbStyles = await voiceOrbWrapper.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        zIndex: styles.zIndex,
        position: styles.position,
        display: styles.display,
        opacity: styles.opacity
      };
    });
    
    expect(orbStyles.zIndex).toBe('10');
    expect(orbStyles.position).toBe('absolute');
    expect(orbStyles.display).toBe('flex');
    expect(orbStyles.opacity).toBe('1');
  });

  test('Settings modal opens correctly with proper animations', async ({ page }) => {
    const settingsModal = page.locator('#settingsModal');
    const menuBtn = page.locator('#menuBtn');
    
    // Check modal is initially hidden
    await expect(settingsModal).not.toHaveClass(/open/);
    expect(await settingsModal.getAttribute('aria-hidden')).toBe('true');
    
    // Click hamburger menu to open modal
    await menuBtn.click();
    
    // Check modal is open
    await expect(settingsModal).toHaveClass(/open/);
    expect(await settingsModal.getAttribute('aria-hidden')).toBe('false');
    
    // Check modal content is visible
    const settingsContent = page.locator('.settings-content');
    await expect(settingsContent).toBeVisible();
    
    // Check backdrop is visible
    const settingsBackdrop = page.locator('#settingsBackdrop');
    await expect(settingsBackdrop).toBeVisible();
  });

  test('Settings modal closes with close button', async ({ page }) => {
    const settingsModal = page.locator('#settingsModal');
    const menuBtn = page.locator('#menuBtn');
    const settingsClose = page.locator('#settingsClose');
    
    // Open modal
    await menuBtn.click();
    await expect(settingsModal).toHaveClass(/open/);
    
    // Close modal with close button
    await settingsClose.click();
    
    // Check modal is closed
    await expect(settingsModal).not.toHaveClass(/open/);
    expect(await settingsModal.getAttribute('aria-hidden')).toBe('true');
  });

  test('Settings modal closes when clicking backdrop', async ({ page }) => {
    const settingsModal = page.locator('#settingsModal');
    const menuBtn = page.locator('#menuBtn');
    const settingsBackdrop = page.locator('#settingsBackdrop');
    
    // Open modal
    await menuBtn.click();
    await expect(settingsModal).toHaveClass(/open/);
    
    // Click backdrop to close modal
    await settingsBackdrop.click();
    
    // Check modal is closed
    await expect(settingsModal).not.toHaveClass(/open/);
    expect(await settingsModal.getAttribute('aria-hidden')).toBe('true');
  });

  test('Settings modal closes with Escape key', async ({ page }) => {
    const settingsModal = page.locator('#settingsModal');
    const menuBtn = page.locator('#menuBtn');
    
    // Open modal
    await menuBtn.click();
    await expect(settingsModal).toHaveClass(/open/);
    
    // Press Escape key
    await page.keyboard.press('Escape');
    
    // Check modal is closed
    await expect(settingsModal).not.toHaveClass(/open/);
    expect(await settingsModal.getAttribute('aria-hidden')).toBe('true');
  });

  test('Focus management works correctly', async ({ page }) => {
    const settingsModal = page.locator('#settingsModal');
    const menuBtn = page.locator('#menuBtn');
    const settingsClose = page.locator('#settingsClose');
    
    // Focus menu button first
    await menuBtn.focus();
    
    // Open modal
    await menuBtn.click();
    await expect(settingsModal).toHaveClass(/open/);
    
    // Check close button is focused
    await expect(settingsClose).toBeFocused();
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Check menu button is focused again
    await expect(menuBtn).toBeFocused();
  });

  test('Modal has proper z-index layering', async ({ page }) => {
    const settingsModal = page.locator('#settingsModal');
    const voiceOrbWrapper = page.locator('#voiceOrbWrapper');
    
    // Check initial z-index values
    const modalStyles = await settingsModal.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        zIndex: styles.zIndex,
        position: styles.position
      };
    });
    
    const orbStyles = await voiceOrbWrapper.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        zIndex: styles.zIndex,
        position: styles.position
      };
    });
    
    // Modal should have higher z-index than orb
    expect(parseInt(modalStyles.zIndex)).toBeGreaterThan(parseInt(orbStyles.zIndex));
    expect(modalStyles.zIndex).toBe('1000');
    expect(orbStyles.zIndex).toBe('10');
  });

  test('Modal prevents body scroll when open', async ({ page }) => {
    const settingsModal = page.locator('#settingsModal');
    const menuBtn = page.locator('#menuBtn');
    
    // Check initial body overflow
    const initialOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(initialOverflow).toBe('');
    
    // Open modal
    await menuBtn.click();
    await expect(settingsModal).toHaveClass(/open/);
    
    // Check body overflow is hidden
    const modalOpenOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(modalOpenOverflow).toBe('hidden');
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Check body overflow is restored
    const modalClosedOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(modalClosedOverflow).toBe('');
  });

  test('Modal is responsive on different screen sizes', async ({ page }) => {
    const settingsModal = page.locator('#settingsModal');
    const menuBtn = page.locator('#menuBtn');
    
    // Test desktop size
    await page.setViewportSize({ width: 1200, height: 800 });
    await menuBtn.click();
    await expect(settingsModal).toHaveClass(/open/);
    
    const desktopStyles = await page.locator('.settings-content').evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        maxWidth: styles.maxWidth,
        width: styles.width
      };
    });
    
    expect(desktopStyles.maxWidth).toBe('520px');
    
    // Test mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.keyboard.press('Escape'); // Close modal first
    await menuBtn.click(); // Reopen modal
    
    const mobileStyles = await page.locator('.settings-content').evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        maxWidth: styles.maxWidth,
        width: styles.width
      };
    });
    
    expect(mobileStyles.maxWidth).toBe('100%');
  });

  test('Voice orb remains visible and functional with modal open', async ({ page }) => {
    const voiceOrbWrapper = page.locator('#voiceOrbWrapper');
    const settingsModal = page.locator('#settingsModal');
    const menuBtn = page.locator('#menuBtn');
    
    // Check voice orb is initially visible
    await expect(voiceOrbWrapper).toBeVisible();
    
    // Open modal
    await menuBtn.click();
    await expect(settingsModal).toHaveClass(/open/);
    
    // Voice orb should still be visible (though behind modal)
    await expect(voiceOrbWrapper).toBeVisible();
    
    // Check voice orb styles haven't changed
    const orbStyles = await voiceOrbWrapper.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        opacity: styles.opacity,
        visibility: styles.visibility
      };
    });
    
    expect(orbStyles.display).toBe('flex');
    expect(orbStyles.opacity).toBe('1');
    expect(orbStyles.visibility).toBe('visible');
    
    // Close modal
    await page.keyboard.press('Escape');
    
    // Voice orb should still be visible and functional
    await expect(voiceOrbWrapper).toBeVisible();
  });

  test('All settings controls are accessible and functional', async ({ page }) => {
    const settingsModal = page.locator('#settingsModal');
    const menuBtn = page.locator('#menuBtn');
    
    // Open modal
    await menuBtn.click();
    await expect(settingsModal).toHaveClass(/open/);
    
    // Check all form controls are present and accessible
    const serverUrl = page.locator('#serverUrl');
    const continuousMode = page.locator('#continuousMode');
    const desktopMode = page.locator('#desktopMode');
    const temperatureSlider = page.locator('#temperatureSlider');
    const memoryEnabled = page.locator('#memoryEnabled');
    const specialInstructions = page.locator('#specialInstructions');
    const connectBtn = page.locator('#connectBtn');
    const interruptBtn = page.locator('#interruptBtn');
    
    await expect(serverUrl).toBeVisible();
    await expect(continuousMode).toBeVisible();
    await expect(desktopMode).toBeVisible();
    await expect(temperatureSlider).toBeVisible();
    await expect(memoryEnabled).toBeVisible();
    await expect(specialInstructions).toBeVisible();
    await expect(connectBtn).toBeVisible();
    await expect(interruptBtn).toBeVisible();
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(serverUrl).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(continuousMode).toBeFocused();
  });
});
