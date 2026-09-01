(() => {
  const STORAGE_KEY = 'paperdev_progress_v3';
  const LEGACY_COOKIE = 'paperdev_progress';

  function readCookie(name) {
    const row = document.cookie.split('; ').find(x => x.startsWith(name + '='));
    if (!row) return null;
    try { return decodeURIComponent(row.slice(name.length + 1)); } catch { return null; }
  }

  function normalize(value) {
    if (!value || typeof value !== 'object') return { completed: {}, scores: {}, history: [] };
    return {
      completed: value.completed && typeof value.completed === 'object' ? value.completed : {},
      scores: value.scores && typeof value.scores === 'object' ? value.scores : {},
      history: Array.isArray(value.history) ? value.history.slice(0, 500) : []
    };
  }

  function hasProgress(state) {
    return Object.keys(state.completed || {}).length > 0 || Object.keys(state.scores || {}).length > 0 || (state.history || []).length > 0;
  }

  function fromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch {}

    // app.js has already loaded the legacy/chunked cookie into `progress`.
    // Reuse it first so migration can never erase an existing course state.
    try {
      if (typeof progress !== 'undefined' && hasProgress(progress)) return normalize(progress);
    } catch {}

    try {
      const legacy = readCookie(LEGACY_COOKIE);
      if (legacy) return normalize(JSON.parse(legacy));
    } catch {}

    return { completed: {}, scores: {}, history: [] };
  }

  function persist() {
    const state = normalize(progress);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(STORAGE_KEY + '_updated', new Date().toISOString());
    } catch {
      try {
        const compact = JSON.stringify({ completed: state.completed, scores: state.scores });
        document.cookie = `paperdev_progress_fallback=${encodeURIComponent(compact)}; Max-Age=${365 * 86400}; Path=/; SameSite=Lax`;
      } catch {}
    }
    window.dispatchEvent(new CustomEvent('paperprogresschange'));
    const status = document.querySelector('#saveState');
    if (status) status.textContent = 'Progression sauvegardée';
  }

  const migrated = fromStorage();
  progress = migrated;
  saveProgress = persist;

  // Persist immediately so the current state survives even before the next quiz.
  persist();

  window.addEventListener('paperprogresschange', () => {
    try {
      if (typeof renderSkills === 'function') renderSkills();
      if (typeof renderRecommendations === 'function') renderRecommendations();
      if (typeof renderOverallProgress === 'function') renderOverallProgress();
      if (typeof drawBadges === 'function') drawBadges();
    } catch {}
  });

  try {
    if (typeof render === 'function') render();
  } catch {}
})();