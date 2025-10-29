/**
 * Update UI Module
 * Handles update notifications and UI in the sidepanel
 */

export class UpdateUI {
  constructor() {
    this.updateBanner = document.getElementById('update-banner');
    this.versionSpan = document.getElementById('update-version');
    this.installBtn = document.getElementById('update-install-btn');
    this.dismissBtn = document.getElementById('update-dismiss-btn');
    
    this.currentUpdate = null;
    
    this.init();
  }

  init() {
    // Wire up button handlers
    if (this.installBtn) {
      this.installBtn.addEventListener('click', () => this.onInstallClick());
    }
    
    if (this.dismissBtn) {
      this.dismissBtn.addEventListener('click', () => this.onDismissClick());
    }

    // Check for updates on load
    this.checkForUpdates();

    // Listen for update messages from background
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'UPDATE_AVAILABLE') {
        this.showUpdateBanner(message.updateInfo);
      }
    });
  }

  async checkForUpdates() {
    try {
      // Request update check from background
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_UPDATE' });
      
      if (response && response.hasUpdate) {
        this.showUpdateBanner(response.info);
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }

  showUpdateBanner(updateInfo) {
    if (!this.updateBanner || !updateInfo) return;

    this.currentUpdate = updateInfo;
    
    // Update version text
    if (this.versionSpan) {
      this.versionSpan.textContent = `v${updateInfo.latestVersion}`;
    }

    // Show banner with animation
    this.updateBanner.style.display = 'block';
    this.updateBanner.style.animation = 'slideDown 0.3s ease-out';
  }

  hideBanner() {
    if (!this.updateBanner) return;
    
    this.updateBanner.style.animation = 'slideUp 0.3s ease-in';
    setTimeout(() => {
      this.updateBanner.style.display = 'none';
    }, 300);
  }

  async onInstallClick() {
    if (!this.currentUpdate) return;

    try {
      // Change button text to show progress
      if (this.installBtn) {
        this.installBtn.textContent = 'Downloading...';
        this.installBtn.disabled = true;
      }

      // Request installation from background
      const response = await chrome.runtime.sendMessage({ 
        type: 'INSTALL_UPDATE' 
      });

      if (response && response.success) {
        // Show success state
        if (this.installBtn) {
          this.installBtn.textContent = 'Downloaded!';
          this.installBtn.style.background = '#10b981';
          this.installBtn.style.color = '#fff';
        }

        // Show instructions after a moment
        setTimeout(() => {
          this.showInstallInstructions();
        }, 1500);
      } else {
        throw new Error(response?.error || 'Installation failed');
      }

    } catch (error) {
      console.error('Update installation failed:', error);
      
      // Reset button
      if (this.installBtn) {
        this.installBtn.textContent = 'Download Failed';
        this.installBtn.style.background = '#ef4444';
        this.installBtn.style.color = '#fff';
        this.installBtn.disabled = false;
      }

      // Reset after delay
      setTimeout(() => {
        if (this.installBtn) {
          this.installBtn.textContent = 'Download';
          this.installBtn.style.background = '#fff';
          this.installBtn.style.color = '#667eea';
        }
      }, 3000);
    }
  }

  onDismissClick() {
    this.hideBanner();
    
    // Store dismissal in storage (don't show again for 24 hours)
    chrome.storage.local.set({
      'atlas-update-dismissed': Date.now()
    });
  }

  showInstallInstructions() {
    // Update banner to show installation instructions
    if (!this.updateBanner) return;

    this.updateBanner.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:10px;">
        <span style="font-size:24px;">📥</span>
        <div style="flex:1;">
          <strong style="font-size:15px;">Update Downloaded!</strong>
          <div style="margin-top:8px; font-size:13px; line-height:1.5;">
            <strong>Installation Steps:</strong><br>
            1. Open your Downloads folder<br>
            2. Extract <code>atlas-voice-extension-update.zip</code><br>
            3. Go to <code>chrome://extensions</code><br>
            4. Click "Load unpacked" and select the extracted folder
          </div>
        </div>
        <button id="update-close-instructions" style="padding:8px 12px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; border-radius:6px; cursor:pointer; font-size:13px;">
          Close
        </button>
      </div>
    `;

    // Wire up close button
    const closeBtn = document.getElementById('update-close-instructions');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideBanner());
    }
  }
}

// Add animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new UpdateUI();
  });
} else {
  new UpdateUI();
}
