/**
 * Mic Manager - Handles microphone permissions and stream management
 */

export const MicManager = (() => {
  let inFlight = false;
  let cachedStream = null;
  const listeners = new Set();

  function notify(ev) { listeners.forEach(fn => { try { fn(ev); } catch {} }); }

  async function queryPermission() {
    try {
      if (!('permissions' in navigator)) return 'prompt';
      const status = await navigator.permissions.query({ name: 'microphone' });
      return status.state;
    } catch {
      return 'prompt';
    }
  }

  function showBanner(show) {
    const el = document.getElementById('mic-permission-banner');
    if (!el) return;
    el.style.display = show ? 'block' : 'none';
  }

  function wireBannerButtons() {
    const tryBtn = document.getElementById('mic-permission-try-again');
    const dismissBtn = document.getElementById('mic-permission-dismiss');
    if (tryBtn && !tryBtn.dataset._wired) {
      tryBtn.dataset._wired = '1';
      tryBtn.addEventListener('click', async () => {
        showBanner(false);
        try {
          await requestStream();
        } catch (e) {
          console.warn('Retry failed:', e);
          showBanner(true);
        }
      });
    }
    if (dismissBtn && !dismissBtn.dataset._wired) {
      dismissBtn.dataset._wired = '1';
      dismissBtn.addEventListener('click', () => showBanner(false));
    }
  }

  async function requestStream() {
    if (cachedStream && cachedStream.active) return cachedStream;

    if (inFlight) {
      return new Promise((resolve, reject) => {
        const off = (ev) => {
          if (ev.type === 'mic:ready') { listeners.delete(off); resolve(cachedStream); }
          if (ev.type === 'mic:error') { listeners.delete(off); reject(ev.error); }
        };
        listeners.add(off);
      });
    }

    inFlight = true;
    wireBannerButtons();

    try {
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      cachedStream = stream;
      showBanner(false);
      inFlight = false;
      notify({ type: 'mic:ready' });
      return stream;
    } catch (err) {
      inFlight = false;

      const name = err && err.name ? err.name : 'Error';
      const msg = (err && (err.message || err.toString())) || 'Unknown error';

      if (name === 'NotAllowedError') {
        showBanner(true);
        const wrapped = new Error('Microphone permission was blocked or dismissed. Click the mic icon in the address bar to allow, then click "Try again".');
        wrapped.cause = err;
        notify({ type: 'mic:error', error: wrapped });
        throw wrapped;
      } else if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        const wrapped = new Error('No microphone detected. Please connect a mic or select a working input in system settings, then try again.');
        wrapped.cause = err;
        notify({ type: 'mic:error', error: wrapped });
        throw wrapped;
      } else if (name === 'NotReadableError' || name === 'AbortError') {
        const wrapped = new Error('The microphone is currently in use by another application. Close other apps using the mic and try again.');
        wrapped.cause = err;
        notify({ type: 'mic:error', error: wrapped });
        throw wrapped;
      }

      const wrapped = new Error(`Failed to access microphone: ${name}: ${msg}`);
      wrapped.cause = err;
      notify({ type: 'mic:error', error: wrapped });
      throw wrapped;
    }
  }

  return {
    async ensureMic() {
      const state = await queryPermission();
      try {
        return await requestStream();
      } catch (e) {
        showBanner(true);
        throw e;
      }
    },
    getCachedStream() { return cachedStream; },
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    clearCache() {
      if (cachedStream) {
        try { cachedStream.getTracks().forEach(t => t.stop()); } catch {}
      }
      cachedStream = null;
    }
  };
})();