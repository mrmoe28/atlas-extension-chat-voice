import { test, expect } from '@playwright/test';

test.describe('Hamburger Menu Tests', () => {
  test('Hamburger menu can be clicked and opens settings modal', async ({ page }) => {
    // Navigate to the extension side panel
    await page.goto('chrome-extension://*/sidepanel.html');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that the hamburger menu button exists and is visible
    const menuBtn = page.locator('#menuBtn');
    await expect(menuBtn).toBeVisible();

    // Check that settings modal is initially closed (not visible or not open)
    const settingsModal = page.locator('#settingsModal');
    const modalClasses = await settingsModal.getAttribute('class');
    expect(modalClasses).not.toContain('open');

    // Click the hamburger menu button
    await menuBtn.click();

    // Wait a bit for the modal to open
    await page.waitForTimeout(500);

    // Check that settings modal is now open
    const updatedModalClasses = await settingsModal.getAttribute('class');
    expect(updatedModalClasses).toContain('open');

    // Check that the modal is visible
    await expect(settingsModal).toBeVisible();

    // Click the menu button again to close
    await menuBtn.click();

    // Wait for modal to close
    await page.waitForTimeout(500);

    // Check that modal is closed again
    const closedModalClasses = await settingsModal.getAttribute('class');
    expect(closedModalClasses).not.toContain('open');
  });

  test('Menu button has correct styling and accessibility', async ({ page }) => {
    await page.goto('chrome-extension://*/sidepanel.html');
    await page.waitForLoadState('networkidle');

    const menuBtn = page.locator('#menuBtn');

    // Check button is visible and has correct attributes
    await expect(menuBtn).toBeVisible();
    await expect(menuBtn).toHaveAttribute('type', 'button');

    // Check it has the menu-btn class
    await expect(menuBtn).toHaveClass(/menu-btn/);

    // Check it contains the hamburger icon (SVG)
    const svg = menuBtn.locator('svg');
    await expect(svg).toBeVisible();
  });
});

