/**
 * Atlas Extension Update Manager
 * Handles automatic updates from GitHub Releases
 */

import { isNewerVersion } from './version-compare.js';
import { ErrorHandler } from './error-handler.js';

// Check GitHub Releases directly instead of Vercel endpoint
const GITHUB_RELEASES_API = 'https://api.github.com/repos/mrmoe28/atlas-extension-chat-voice/releases/latest';
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
   * Check for available updates with retry logic
   */
  async checkForUpdates() {
    if (this.isChecking) {
      console.log('Update check already in progress');
      return { checking: true };
    }

    this.isChecking = true;

    try {
      return await ErrorHandler.withRetry(
        () => this._performUpdateCheck(),
        3, // max retries
        2000 // 2 second delay
      );
    } catch (error) {
      console.error('Update check failed after retries:', error);
      return { 
        error: 'Failed to check for updates after multiple attempts',
        details: error.message,
        canRetry: true
      };
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Perform the actual update check using GitHub Releases API
   */
  async _performUpdateCheck() {
    console.log(`Checking for updates... Current version: ${this.currentVersion}`);
    console.log(`GitHub API: ${GITHUB_RELEASES_API}`);

    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(GITHUB_RELEASES_API, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': `Atlas-Extension/${this.currentVersion}`
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // 404 means no releases published yet - this is not an error
        if (response.status === 404) {
          console.log('No releases found on GitHub yet');
          return { hasUpdate: false };
        }
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Update check failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const release = await response.json();
      console.log('GitHub release response:', release);

      // Extract version from tag_name (e.g., "v0.3.2" -> "0.3.2")
      const latestVersion = release.tag_name.replace(/^v/, '');

      // Find the .zip asset
      const zipAsset = release.assets.find(asset => asset.name.endsWith('.zip'));

      if (isNewerVersion(latestVersion, this.currentVersion)) {
        const updateInfo = {
          hasUpdate: true,
          latestVersion: latestVersion,
          downloadUrl: zipAsset?.browser_download_url || release.zipball_url,
          releaseUrl: release.html_url,
          releaseNotes: release.body || 'No release notes available',
          publishedAt: release.published_at
        };

        this.updateAvailable = updateInfo;

        // Store update info
        await chrome.storage.local.set({
          'atlas-update-available': updateInfo,
          'atlas-update-checked-at': Date.now()
        });

        // Show notification
        await this.showUpdateNotification(updateInfo);

        console.log(`Update available: v${latestVersion}`);

        return {
          hasUpdate: true,
          version: latestVersion,
          info: updateInfo
        };
      } else {
        console.log('No updates available - running latest version');
        return { hasUpdate: false };
      }

    } catch (error) {
      clearTimeout(timeoutId);

      // Enhanced error logging with more context
      const errorDetails = {
        message: error.message,
        name: error.name,
        stack: error.stack,
        currentVersion: this.currentVersion,
        apiUrl: GITHUB_RELEASES_API,
        timestamp: new Date().toISOString()
      };

      console.error('Update check error:', errorDetails);

      // Store error for debugging
      try {
        await chrome.storage.local.set({
          'atlas-update-last-error': errorDetails,
          'atlas-update-error-at': Date.now()
        });
      } catch (storageError) {
        console.warn('Failed to store update error:', storageError);
      }

      // Throw error to be handled by retry logic
      throw error;
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
