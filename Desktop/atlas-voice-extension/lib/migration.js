/**
 * Atlas Voice Extension - Data Migration
 * Version 0.2.3 - Fixes knowledge storage by migrating to default_user
 */

(function() {
  'use strict';

  const MIGRATION_VERSION = '0.2.3';
  const MIGRATION_KEY = 'atlasVoice_migrationVersion';

  function checkAndMigrate() {
    const currentMigration = localStorage.getItem(MIGRATION_KEY);

    // Migration already done
    if (currentMigration === MIGRATION_VERSION) {
      console.log('✅ Already migrated to version', MIGRATION_VERSION);
      return;
    }

    console.log('🔄 Starting Atlas Voice migration...');

    // Get old user ID
    const oldUserId = localStorage.getItem('atlasVoice_userId');

    if (oldUserId && oldUserId !== 'default_user') {
      console.log('📦 Migrating user ID from:', oldUserId);
      console.log('📦 New user ID: default_user');

      // Update to new user ID
      localStorage.setItem('atlasVoice_userId', 'default_user');

      // Clear old session data to force refresh
      localStorage.removeItem('atlasVoice_lastSessionId');
      localStorage.removeItem('atlasVoice_lastSessionTime');

      console.log('✅ User ID migrated successfully');

      // Show migration notice
      showMigrationNotice();
    } else if (!oldUserId) {
      console.log('✨ New installation - setting up default_user');
      localStorage.setItem('atlasVoice_userId', 'default_user');
    } else {
      console.log('✅ Already using default_user - no migration needed');
    }

    // Mark migration as complete
    localStorage.setItem(MIGRATION_KEY, MIGRATION_VERSION);
    console.log('🎉 Migration complete!');
  }

  function showMigrationNotice() {
    // Create notification banner
    const notice = document.createElement('div');
    notice.id = 'atlas-migration-notice';
    notice.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 10000;
      animation: slideDown 0.3s ease-out;
    `;

    notice.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
        <span style="font-size: 20px;">✨</span>
        <span><strong>Atlas Updated!</strong> Knowledge storage is now fixed and working properly.</span>
        <button id="atlas-dismiss-notice" style="
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-left: 10px;
        ">Got it</button>
      </div>
    `;

    // Add animation
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
    `;
    document.head.appendChild(style);

    // Add to page
    document.body.insertBefore(notice, document.body.firstChild);

    // Dismiss button
    const dismissBtn = notice.querySelector('#atlas-dismiss-notice');
    dismissBtn.addEventListener('click', () => {
      notice.style.animation = 'slideDown 0.3s ease-out reverse';
      setTimeout(() => notice.remove(), 300);
    });

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      if (notice.parentNode) {
        notice.style.animation = 'slideDown 0.3s ease-out reverse';
        setTimeout(() => notice.remove(), 300);
      }
    }, 8000);
  }

  // Run migration on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndMigrate);
  } else {
    checkAndMigrate();
  }

  // Export for testing
  window.atlasVoiceMigration = {
    version: MIGRATION_VERSION,
    checkAndMigrate
  };
})();
