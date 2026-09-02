(() => {
  const STORAGE_KEY = 'paperdev_progress_v4';
  const LEGACY_STORAGE_KEYS = ['paperdev_progress_v3'];
  const LEGACY_COOKIE = 'paperdev_progress';
  const FALLBACK_COOKIE = 'paperdev_progress_fallback';
  const DB_NAME = 'PaperDevAcademy';
  const DB_VERSION = 1;
  const STORE_NAME = 'state';
  const DB_KEY = 'progress';

  const emptyState = () => ({ completed: {}, scores: {}, history: [] });

  function normalize(value) {
    if (!value || typeof value !== 'object') return emptyState();
    return {
      completed: value.completed && typeof value.completed === 'object' ? value.completed : {},
      scores: value.scores && typeof value.scores === 'object' ? value.scores : {},
      history: Array.isArray(value.history) ? value.history.slice(0, 500) : []
    };
  }

  function hasProgress(state) {
    return Object.keys(state.completed || {}).length > 0 ||
      Object.keys(state.scores || {}).length > 0 ||
      (state.history || []).length > 0;
  }

  function readCookie(name) {
    const row = document.cookie.split('; ').find(x => x.startsWith(name + '='));
    if (!row) return null;
    try { return decodeURIComponent(row.slice(name.length + 1)); } catch { return null; }
  }

  function readCookieChunks(name) {
    const direct = readCookie(name);
    if (direct !== null) return direct;
    const count = Number.parseInt(readCookie(`${name}_chunks`) || '0', 10);
    if (!Number.isInteger(count) || count <= 0) return null;
    let value = '';
    for (let i = 0; i < count; i++) {
      const part = readCookie(`${name}_${i}`);
      if (part === null) return null;
      value += part;
    }
    return value;
  }

  function readStorage() {
    const keys = [STORAGE_KEY, ...LEGACY_STORAGE_KEYS];
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const state = normalize(parsed.state || parsed);
        if (hasProgress(state) || key === STORAGE_KEY) return state;
      } catch {}
    }
    return null;
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
    });
  }

  async function readDb() {
    try {
      const db = await openDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(DB_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => db.close();
      });
    } catch {
      return null;
    }
  }

  async function writeDb(state) {
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({ state, updatedAt: Date.now() }, DB_KEY);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
      });
      db.close();
    } catch {}
  }

  function writeCookieFallback(state) {
    try {
      const compact = JSON.stringify(state);
      document.cookie = `${FALLBACK_COOKIE}=${encodeURIComponent(compact)}; Max-Age=${365 * 86400}; Path=/; SameSite=Lax`;
    } catch {}
  }

  function readCookieFallback() {
    try {
      const raw = readCookie(FALLBACK_COOKIE);
      return raw ? normalize(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  function saveLocal(state) {
    try {
      const envelope = JSON.stringify({ version: 4, savedAt: Date.now(), state });
      localStorage.setItem(STORAGE_KEY, envelope);
      localStorage.setItem(`${STORAGE_KEY}_updated`, new Date().toISOString());
      return true;
    } catch {
      return false;
    }
  }

  function persist() {
    const state = normalize(progress);
    saveLocal(state);
    writeCookieFallback(state);
    void writeDb(state);

    window.dispatchEvent(new CustomEvent('paperprogresschange'));
    const status = document.querySelector('#saveState');
    if (status) status.textContent = 'Progression sauvegardée dans ce navigateur';
  }

  async function bootstrap() {
    const localState = readStorage();
    const dbRecord = await readDb();
    const dbState = dbRecord && dbRecord.state ? normalize(dbRecord.state) : null;
    const appState = (typeof progress !== 'undefined' && hasProgress(progress)) ? normalize(progress) : null;
    const cookieState = (() => {
      try {
        const raw = readCookieChunks(LEGACY_COOKIE);
        return raw ? normalize(JSON.parse(raw)) : null;
      } catch {
        return null;
      }
    })();
    const fallbackState = readCookieFallback();

    // Restore a durable copy first. The current app state is used only when no saved copy exists.
    const candidates = [localState, dbState, appState, cookieState, fallbackState, emptyState()].filter(Boolean);
    progress = candidates[0];
    persist();

    try {
      if (typeof render === 'function') render();
    } catch {}
  }

  // Replace the app's cookie-only save function with the redundant persistent save.
  saveProgress = persist;

  window.addEventListener('paperprogresschange', () => {
    try {
      if (typeof renderSkills === 'function') renderSkills();
      if (typeof renderRecommendations === 'function') renderRecommendations();
      if (typeof renderOverallProgress === 'function') renderOverallProgress();
      if (typeof drawBadges === 'function') drawBadges();
    } catch {}
  });

  // Protect against browser/page lifecycle edge cases.
  window.addEventListener('pagehide', persist, { capture: true });
  window.addEventListener('beforeunload', persist, { capture: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persist();
  });

  void bootstrap();
})();
