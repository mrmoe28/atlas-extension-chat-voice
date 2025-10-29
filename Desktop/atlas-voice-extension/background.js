// Import update manager
import { updateManager } from './lib/update-manager.js';

// Ensure the side panel can be opened across pages.
chrome.runtime.onInstalled.addListener(async (details) => {
  // For Chrome
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  }

  // Initialize update manager on install or update
  if (details.reason === 'install' || details.reason === 'update') {
    console.log(`Atlas ${details.reason}ed: v${chrome.runtime.getManifest().version}`);
    await updateManager.initialize();

    // Show updated notification if this was an update
    if (details.reason === 'update') {
      chrome.notifications.create('atlas-updated', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/icon-128.png'),
        title: 'Atlas Updated!',
        message: `Successfully updated to v${chrome.runtime.getManifest().version}`,
        priority: 1
      });
    }
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (chrome.sidePanel && chrome.sidePanel.open) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});

// Initialize update manager on startup
chrome.runtime.onStartup.addListener(async () => {
  console.log('Atlas starting up...');
  await updateManager.initialize();
});
