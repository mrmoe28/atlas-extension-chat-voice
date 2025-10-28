import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Atlas Voice Extension Layout Tests', () => {
  test('Voice orb visibility and layout', async ({ page }) => {
    // Load the extension HTML directly
    const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
    await page.goto(`file://${extensionPath}`);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if voice orb wrapper is visible
    const voiceOrbWrapper = page.locator('#voiceOrbWrapper');
    await expect(voiceOrbWrapper).toBeVisible();
    
    // Check if voice orb wrapper is not hidden
    const orbClasses = await voiceOrbWrapper.getAttribute('class');
    expect(orbClasses).not.toContain('hidden');
    
    // Check voice orb wrapper styles
    const orbStyles = await voiceOrbWrapper.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        opacity: styles.opacity,
        visibility: styles.visibility,
        position: styles.position,
        top: styles.top,
        bottom: styles.bottom,
        left: styles.left,
        right: styles.right
      };
    });
    
    console.log('Voice orb wrapper styles:', orbStyles);
    
    // Verify correct styles
    expect(orbStyles.display).toBe('flex');
    expect(orbStyles.opacity).toBe('1');
    expect(orbStyles.visibility).toBe('visible');
    expect(orbStyles.position).toBe('absolute');
    expect(orbStyles.top).toBe('0px');
    expect(orbStyles.bottom).toBe('60px');
    expect(orbStyles.left).toBe('0px');
    expect(orbStyles.right).toBe('0px');
    
    // Check if the actual voice orb element exists and is visible
    const voiceOrb = page.locator('#voiceOrb');
    await expect(voiceOrb).toBeVisible();
    
    // Check orb status text
    const orbStatus = page.locator('#orbStatus');
    await expect(orbStatus).toBeVisible();
    const statusText = await orbStatus.textContent();
    expect(statusText).toContain('Click Connect');
    
    // Check voice orb size
    const orbSize = await voiceOrb.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        width: styles.width,
        height: styles.height
      };
    });
    
    console.log('Voice orb size:', orbSize);
    expect(orbSize.width).toBe('200px');
    expect(orbSize.height).toBe('200px');
  });

  test('Settings menu toggle functionality', async ({ page }) => {
    // Load the extension HTML directly
    const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
    await page.goto(`file://${extensionPath}`);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check voice orb is initially visible
    const voiceOrbWrapper = page.locator('#voiceOrbWrapper');
    await expect(voiceOrbWrapper).toBeVisible();
    
    // Check hamburger menu button
    const menuBtn = page.locator('#menuBtn');
    await expect(menuBtn).toBeVisible();
    
    // Click hamburger menu to open settings
    await menuBtn.click();
    
    // Check settings dropdown is open
    const settingsDropdown = page.locator('#settingsDropdown');
    await expect(settingsDropdown).toHaveClass(/open/);
    
    // Voice orb should still be visible (not hidden by class)
    const orbClasses = await voiceOrbWrapper.getAttribute('class');
    expect(orbClasses).not.toContain('hidden');
    
    // Check settings dropdown height
    const dropdownHeight = await settingsDropdown.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.maxHeight;
    });
    
    console.log('Settings dropdown max-height:', dropdownHeight);
    expect(dropdownHeight).toBe('50vh');
    
    // Click menu button again to close settings
    await menuBtn.click();
    
    // Check settings dropdown is closed
    await expect(settingsDropdown).not.toHaveClass(/open/);
    
    // Voice orb should still be visible
    await expect(voiceOrbWrapper).toBeVisible();
    const orbClassesAfter = await voiceOrbWrapper.getAttribute('class');
    expect(orbClassesAfter).not.toContain('hidden');
  });

  test('Connect button visibility', async ({ page }) => {
    // Load the extension HTML directly
    const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
    await page.goto(`file://${extensionPath}`);
    
    // Wait for the page to load
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
    
    // Check button styles
    const buttonStyles = await connectBtn.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity
      };
    });
    
    console.log('Connect button styles:', buttonStyles);
    expect(buttonStyles.display).toBe('block');
    expect(buttonStyles.visibility).toBe('visible');
    expect(buttonStyles.opacity).toBe('1');
  });

  test('Knowledge base settings are present', async ({ page }) => {
    // Load the extension HTML directly
    const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
    await page.goto(`file://${extensionPath}`);
    
    // Wait for the page to load
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
    
    // Check textarea size
    const textareaSize = await specialInstructions.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        minHeight: styles.minHeight,
        height: styles.height
      };
    });
    
    console.log('Special instructions textarea size:', textareaSize);
    expect(textareaSize.minHeight).toBe('45px');
  });

  test('Help section toggle functionality', async ({ page }) => {
    // Load the extension HTML directly
    const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
    await page.goto(`file://${extensionPath}`);
    
    // Wait for the page to load
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
    
    // Check help content max height
    const helpContentHeight = await helpContent.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.maxHeight;
    });
    
    console.log('Help content max-height:', helpContentHeight);
    expect(helpContentHeight).toBe('300px');
    
    // Click to hide help
    await toggleHelpBtn.click();
    
    // Check help content is hidden again
    const afterHideDisplay = await helpContent.evaluate(el => el.style.display);
    expect(afterHideDisplay).toBe('none');
    
    // Check button text changed back
    const buttonTextAfter = await toggleHelpBtn.textContent();
    expect(buttonTextAfter).toBe('Show Commands');
  });

  test('Voice footer and button sizing', async ({ page }) => {
    // Load the extension HTML directly
    const extensionPath = path.join(process.cwd(), 'extension', 'sidepanel.html');
    await page.goto(`file://${extensionPath}`);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check voice footer
    const voiceFooter = page.locator('.voice-footer');
    await expect(voiceFooter).toBeVisible();
    
    // Check voice footer padding
    const footerPadding = await voiceFooter.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.padding;
    });
    
    console.log('Voice footer padding:', footerPadding);
    expect(footerPadding).toBe('12px');
    
    // Check voice button
    const voiceBtn = page.locator('#voiceBtn');
    await expect(voiceBtn).toBeVisible();
    
    // Check voice button size
    const buttonSize = await voiceBtn.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        width: styles.width,
        height: styles.height
      };
    });
    
    console.log('Voice button size:', buttonSize);
    expect(buttonSize.width).toBe('70px');
    expect(buttonSize.height).toBe('70px');
    
    // Check voice status text
    const voiceStatus = page.locator('#voiceStatus');
    await expect(voiceStatus).toBeVisible();
    
    // Check voice status font size
    const statusFontSize = await voiceStatus.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.fontSize;
    });
    
    console.log('Voice status font size:', statusFontSize);
    expect(statusFontSize).toBe('12px');
  });
});
