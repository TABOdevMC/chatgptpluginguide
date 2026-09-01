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

  function fromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch {}
    try {
      const legacy = readCookie(LEGACY_COOKIE);
      if (legacy) return normalize(JSON.parse(legacy));
    } catch {}
    return { completed: {}, scores: {}, history: [] };
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      localStorage.setItem(STORAGE_KEY + '_updated', new Date().toISOString());
    } catch {
      // Fallback minimal cookie for browsers where localStorage is unavailable.
      try {
        const compact = JSON.stringify({ completed: progress.completed, scores: progress.scores });
        document.cookie = `paperdev_progress_fallback=${encodeURIComponent(compact)}; Max-Age=${365 * 86400}; Path=/; SameSite=Lax`;
      } catch {}
    }
    window.dispatchEvent(new CustomEvent('paperprogresschange'));
    const status = document.querySelector('#saveState');
    if (status) status.textContent = 'Progression sauvegardée';
  }

  // Replace the in-memory state loaded by app.js with the durable local state.
  progress = fromStorage();
  saveProgress = persist;

  // Keep the UI synchronized whenever another module changes progress.
  window.addEventListener('paperprogresschange', () => {
    try {
      if (typeof renderSkills === 'function') renderSkills();
      if (typeof renderRecommendations === 'function') renderRecommendations();
      if (typeof renderOverallProgress === 'function') renderOverallProgress();
      if (typeof drawBadges === 'function') drawBadges();
    } catch {}
  });

  // Refresh every view immediately after the override.
  try {
    if (typeof render === 'function') render();
    if (typeof renderProgress === 'function') renderProgress();
  } catch {}
})();