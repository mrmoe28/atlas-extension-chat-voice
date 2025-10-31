import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Atlas Voice Extension Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Load the extension from root directory
    const extensionPath = path.join(process.cwd());
    
    await page.goto('chrome://extensions/');
    
    // Enable developer mode and load unpacked extension
    await page.evaluate(() => {
      // Enable developer mode
      const devModeToggle = document.querySelector('extensions-manager').shadowRoot
        .querySelector('extensions-toolbar').shadowRoot
        .querySelector('#devMode');
      if (devModeToggle && !devModeToggle.checked) {
        devModeToggle.click();
      }
    });
    
    // Load the extension
    await page.evaluate((extPath) => {
      const loadButton = document.querySelector('extensions-manager').shadowRoot
        .querySelector('extensions-toolbar').shadowRoot
        .querySelector('#loadUnpacked');
      if (loadButton) {
        loadButton.click();
      }
    }, extensionPath);
    
    // Wait for extension to load
    await page.waitForTimeout(2000);
  });

  test('Voice orb is visible when settings menu is collapsed', async ({ page }) => {
    // Open the extension side panel
    await page.goto('chrome-extension://*/sidepanel.html');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if voice orb wrapper is visible
    const voiceOrbWrapper = page.locator('#voiceOrbWrapper');
    await expect(voiceOrbWrapper).toBeVisible();
    
    // Check if voice orb has correct classes (not hidden)
    const orbClasses = await voiceOrbWrapper.getAttribute('class');
    expect(orbClasses).not.toContain('hidden');
    
    // Check if voice orb is properly positioned
    const orbStyles = await voiceOrbWrapper.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        opacity: styles.opacity,
        visibility: styles.visibility,
        position: styles.position
      };
    });
    
    expect(orbStyles.display).toBe('flex');
    expect(orbStyles.opacity).toBe('1');
    expect(orbStyles.visibility).toBe('visible');
    expect(orbStyles.position).toBe('absolute');
    
    // Check if the actual voice orb element exists
    const voiceOrb = page.locator('#voiceOrb');
    await expect(voiceOrb).toBeVisible();
    
    // Check orb status text
    const orbStatus = page.locator('#orbStatus');
    await expect(orbStatus).toBeVisible();
    const statusText = await orbStatus.textContent();
    expect(statusText).toContain('Click Connect');
  });

  test('Settings menu can be toggled without hiding voice orb', async ({ page }) => {
    // Open the extension side panel
    await page.goto('chrome-extension://*/sidepanel.html');
    await page.waitForLoadState('networkidle');
    
    // Check voice orb is initially visible
    const voiceOrbWrapper = page.locator('#voiceOrbWrapper');
    await expect(voiceOrbWrapper).toBeVisible();
    
    // Click hamburger menu to open settings
    const menuBtn = page.locator('#menuBtn');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    
    // Check settings modal is open
    const settingsModal = page.locator('#settingsModal');
    await expect(settingsModal).toHaveClass(/open/);
    
    // Voice orb should still be visible (might be behind dropdown but not hidden)
    const orbClasses = await voiceOrbWrapper.getAttribute('class');
    expect(orbClasses).not.toContain('hidden');
    
    // Click menu button again to close settings
    await menuBtn.click();
    
    // Check settings dropdown is closed
    await expect(settingsDropdown).not.toHaveClass(/open/);
    
    // Voice orb should still be visible
    await expect(voiceOrbWrapper).toBeVisible();
    const orbClassesAfter = await voiceOrbWrapper.getAttribute('class');
    expect(orbClassesAfter).not.toContain('hidden');
  });

  test('Connect button is visible and functional', async ({ page }) => {
    // Open the extension side panel
    await page.goto('chrome-extension://*/sidepanel.html');
    await page.waitForLoadState('networkidle');
    
    // Open settings menu to access Connect button
    const menuBtn = page.locator('#menuBtn');
    await menuBtn.click();
    
    // Check Connect button exists and is visible
    const connectBtn = page.locator('#connectBtn');
    await expect(connectBtn).toBeVisible();
    
    // Check button text
    const buttonText = await connectBtn.textContent();
    expect(buttonText).toBe('Connect');
    
    // Check button is not disabled initially
    await expect(connectBtn).not.toBeDisabled();
  });

  test('Settings dropdown height is reasonable', async ({ page }) => {
    // Open the extension side panel
    await page.goto('chrome-extension://*/sidepanel.html');
    await page.waitForLoadState('networkidle');
    
    // Open settings menu
    const menuBtn = page.locator('#menuBtn');
    await menuBtn.click();
    
    // Check settings dropdown height
    const settingsDropdown = page.locator('#settingsDropdown');
    await expect(settingsDropdown).toBeVisible();
    
    const dropdownHeight = await settingsDropdown.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.maxHeight;
    });
    
    // Should be 50vh or less
    expect(dropdownHeight).toBe('50vh');
    
    // Check if dropdown is scrollable if content exceeds height
    const isScrollable = await settingsDropdown.evaluate(el => {
      return el.scrollHeight > el.clientHeight;
    });
    
    // If scrollable, ensure scrollbar is present
    if (isScrollable) {
      const scrollbarWidth = await settingsDropdown.evaluate(el => {
        return el.offsetWidth - el.clientWidth;
      });
      expect(scrollbarWidth).toBeGreaterThan(0);
    }
  });

  test('All knowledge base settings are present and functional', async ({ page }) => {
    // Open the extension side panel
    await page.goto('chrome-extension://*/sidepanel.html');
    await page.waitForLoadState('networkidle');
    
    // Open settings menu
    const menuBtn = page.locator('#menuBtn');
    await menuBtn.click();
    
    // Check temperature slider
    const temperatureSlider = page.locator('#temperatureSlider');
    await expect(temperatureSlider).toBeVisible();
    
    // Check temperature value display
    const temperatureValue = page.locator('#temperatureValue');
    await expect(temperatureValue).toBeVisible();
    const tempValue = await temperatureValue.textContent();
    expect(tempValue).toBe('0.7');
    
    // Check memory enabled checkbox
    const memoryEnabled = page.locator('#memoryEnabled');
    await expect(memoryEnabled).toBeVisible();
    
    // Check special instructions textarea
    const specialInstructions = page.locator('#specialInstructions');
    await expect(specialInstructions).toBeVisible();
    
    // Check knowledge base buttons
    const viewKnowledgeBtn = page.locator('#viewKnowledgeBtn');
    await expect(viewKnowledgeBtn).toBeVisible();
    
    const clearMemoryBtn = page.locator('#clearMemoryBtn');
    await expect(clearMemoryBtn).toBeVisible();
  });

  test('Help section can be toggled', async ({ page }) => {
    // Open the extension side panel
    await page.goto('chrome-extension://*/sidepanel.html');
    await page.waitForLoadState('networkidle');
    
    // Open settings menu
    const menuBtn = page.locator('#menuBtn');
    await menuBtn.click();
    
    // Check help toggle button
    const toggleHelpBtn = page.locator('#toggleHelpBtn');
    await expect(toggleHelpBtn).toBeVisible();
    
    // Check initial state (should be hidden)
    const helpContent = page.locator('#helpContent');
    const initialDisplay = await helpContent.evaluate(el => el.style.display);
    expect(initialDisplay).toBe('none');
    
    // Click to show help
    await toggleHelpBtn.click();
    
    // Check help content is now visible
    const afterClickDisplay = await helpContent.evaluate(el => el.style.display);
    expect(afterClickDisplay).toBe('block');
    
    // Check button text changed
    const buttonText = await toggleHelpBtn.textContent();
    expect(buttonText).toBe('Hide Commands');
    
    // Click to hide help
    await toggleHelpBtn.click();
    
    // Check help content is hidden again
    const afterHideDisplay = await helpContent.evaluate(el => el.style.display);
    expect(afterHideDisplay).toBe('none');
    
    // Check button text changed back
    const buttonTextAfter = await toggleHelpBtn.textContent();
    expect(buttonTextAfter).toBe('Show Commands');
  });

  test('Layout is responsive and compact', async ({ page }) => {
    // Open the extension side panel
    await page.goto('chrome-extension://*/sidepanel.html');
    await page.waitForLoadState('networkidle');
    
    // Check main content area
    const mainContent = page.locator('.main-content');
    await expect(mainContent).toBeVisible();
    
    // Check voice orb wrapper positioning
    const voiceOrbWrapper = page.locator('#voiceOrbWrapper');
    const orbPosition = await voiceOrbWrapper.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        top: styles.top,
        bottom: styles.bottom,
        left: styles.left,
        right: styles.right
      };
    });
    
    expect(orbPosition.top).toBe('0px');
    expect(orbPosition.bottom).toBe('60px');
    expect(orbPosition.left).toBe('0px');
    expect(orbPosition.right).toBe('0px');
    
    // Check voice footer
    const voiceFooter = page.locator('.voice-footer');
    await expect(voiceFooter).toBeVisible();
    
    // Check voice button size
    const voiceBtn = page.locator('#voiceBtn');
    const buttonSize = await voiceBtn.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        width: styles.width,
        height: styles.height
      };
    });
    
    expect(buttonSize.width).toBe('70px');
    expect(buttonSize.height).toBe('70px');
  });
});
