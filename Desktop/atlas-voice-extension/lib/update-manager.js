/**
 * Atlas Extension Update Manager
 * Handles automatic updates from GitHub Releases
 */

import { isNewerVersion } from './version-compare.js';

const UPDATE_API_URL = 'https://atlas-extension-chat-voice.vercel.app/api/updates/check';
const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000; // 4 hours
const UPDATE_ALARM_NAME = 'atlas-update-check';

export class UpdateManager {
  constructor() {
    this.currentVersion = chrome.runtime.getManifest().version;
    this.isChecking = false;
    this.updateAvailable = null;
  }

  /**
   * Initialize the update manager
   */
  async initialize() {
    console.log(`Atlas v${this.currentVersion} - Update manager initialized`);

    // Check for updates on startup
    await this.checkForUpdates();

    // Schedule periodic checks
    this.schedulePeriodicChecks();

    // Listen for manual update requests
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'CHECK_UPDATE') {
        this.checkForUpdates().then(sendResponse);
        return true; // Keep channel open for async response
      }
      if (message.type === 'INSTALL_UPDATE') {
        this.installUpdate().then(sendResponse);
        return true;
      }
    });
  }

  /**
   * Schedule periodic update checks
   */
  schedulePeriodicChecks() {
    // Clear existing alarm
    chrome.alarms.clear(UPDATE_ALARM_NAME);

    // Create alarm for periodic checks
    chrome.alarms.create(UPDATE_ALARM_NAME, {
      periodInMinutes: UPDATE_CHECK_INTERVAL / (60 * 1000)
    });

    // Listen for alarm
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === UPDATE_ALARM_NAME) {
        console.log('Periodic update check triggered');
        this.checkForUpdates();
      }
    });
  }

  /**
   * Check for available updates
   */
  async checkForUpdates() {
    if (this.isChecking) {
      console.log('Update check already in progress');
      return { checking: true };
    }

    this.isChecking = true;

    try {
      console.log(`Checking for updates... Current version: ${this.currentVersion}`);

      const response = await fetch(
        `${UPDATE_API_URL}?currentVersion=${this.currentVersion}`
      );

      if (!response.ok) {
        throw new Error(`Update check failed: ${response.status}`);
      }

      const updateInfo = await response.json();
      console.log('Update check response:', updateInfo);

      if (updateInfo.hasUpdate) {
        this.updateAvailable = updateInfo;

        // Store update info
        await chrome.storage.local.set({
          'atlas-update-available': updateInfo,
          'atlas-update-checked-at': Date.now()
        });

        // Show notification
        await this.showUpdateNotification(updateInfo);

        console.log(`Update available: v${updateInfo.latestVersion}`);

        return {
          hasUpdate: true,
          version: updateInfo.latestVersion,
          info: updateInfo
        };
      } else {
        console.log('No updates available');
        return { hasUpdate: false };
      }

    } catch (error) {
      console.error('Update check error:', error);
      return { error: error.message };
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Show update notification to user
   */
  async showUpdateNotification(updateInfo) {
    try {
      await chrome.notifications.create('atlas-update', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/icon-128.png'),
        title: 'Atlas Update Available!',
        message: `Version ${updateInfo.latestVersion} is ready to install.`,
        buttons: [
          { title: 'Install Now' },
          { title: 'Later' }
        ],
        priority: 2,
        requireInteraction: true
      });

      // Listen for notification button clicks
      chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
        if (notifId === 'atlas-update') {
          if (buttonIndex === 0) {
            // Install Now clicked
            this.installUpdate();
          }
          chrome.notifications.clear(notifId);
        }
      });

    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Download and install the update
   */
  async installUpdate() {
    try {
      if (!this.updateAvailable) {
        throw new Error('No update available to install');
      }

      console.log('Installing update...', this.updateAvailable);

      // Show installing notification
      await chrome.notifications.create('atlas-installing', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/icon-128.png'),
        title: 'Installing Atlas Update',
        message: 'Downloading and installing update...',
        priority: 1
      });

      // Download the update ZIP
      const downloadId = await this.downloadUpdate(this.updateAvailable.downloadUrl);

      console.log('Update downloaded:', downloadId);

      // The actual installation happens through Chrome's extension update mechanism
      // We'll reload the extension after download
      await this.completeInstallation(downloadId);

    } catch (error) {
      console.error('Installation error:', error);
      
      await chrome.notifications.create('atlas-update-error', {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('assets/icon-128.png'),
        title: 'Update Failed',
        message: `Failed to install update: ${error.message}`,
        priority: 2
      });

      throw error;
    }
  }

  /**
   * Download the update ZIP
   */
  async downloadUpdate(downloadUrl) {
    return new Promise((resolve, reject) => {
      chrome.downloads.download(
        {
          url: downloadUrl,
          filename: 'atlas-voice-extension-update.zip',
          saveAs: false
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          // Monitor download progress
          const listener = (delta) => {
            if (delta.id === downloadId) {
              if (delta.state?.current === 'complete') {
                chrome.downloads.onChanged.removeListener(listener);
                resolve(downloadId);
              } else if (delta.state?.current === 'interrupted') {
                chrome.downloads.onChanged.removeListener(listener);
                reject(new Error('Download interrupted'));
              }
            }
          };

          chrome.downloads.onChanged.addListener(listener);
        }
      );
    });
  }

  /**
   * Complete installation after download
   */
  async completeInstallation(downloadId) {
    // Store installation info
    await chrome.storage.local.set({
      'atlas-update-downloaded': downloadId,
      'atlas-update-ready': true,
      'atlas-update-version': this.updateAvailable.latestVersion
    });

    // Show completion notification
    await chrome.notifications.create('atlas-update-complete', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('assets/icon-128.png'),
      title: 'Update Downloaded!',
      message: `Atlas v${this.updateAvailable.latestVersion} is ready. Please extract and reload the extension to complete the update.`,
      buttons: [
        { title: 'Instructions' }
      ],
      priority: 2,
      requireInteraction: true
    });

    // Listen for instructions button
    chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
      if (notifId === 'atlas-update-complete' && buttonIndex === 0) {
        // Open instructions
        chrome.tabs.create({
          url: this.updateAvailable.releaseUrl
        });
        chrome.notifications.clear(notifId);
      }
    });

    // Clear update info
    this.updateAvailable = null;
  }

  /**
   * Get update status
   */
  async getUpdateStatus() {
    const stored = await chrome.storage.local.get([
      'atlas-update-available',
      'atlas-update-checked-at',
      'atlas-update-ready'
    ]);

    return {
      currentVersion: this.currentVersion,
      updateAvailable: stored['atlas-update-available'] || null,
      lastChecked: stored['atlas-update-checked-at'] || null,
      updateReady: stored['atlas-update-ready'] || false
    };
  }
}

// Export singleton instance
export const updateManager = new UpdateManager();
