(() => {
  const KEY = 'paperdev_progress_v2';
  const OLD = 'paperdev_progress';
  const DAYS = 365;

  function get(name) {
    const row = document.cookie.split('; ').find(x => x.startsWith(name + '='));
    if (!row) return null;
    try { return decodeURIComponent(row.slice(name.length + 1)); } catch { return null; }
  }

  function set(name, value) {
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${DAYS * 86400}; Path=/; SameSite=Lax`;
  }

  function normalize(raw) {
    if (!raw || typeof raw !== 'object') return { completed: {}, scores: {}, history: [] };
    return {
      completed: raw.completed && typeof raw.completed === 'object' ? raw.completed : {},
      scores: raw.scores && typeof raw.scores === 'object' ? raw.scores : {},
      history: Array.isArray(raw.history) ? raw.history.slice(0, 200) : []
    };
  }

  function read() {
    try {
      const current = get(KEY);
      if (current) return normalize(JSON.parse(current));
      const legacy = get(OLD);
      if (legacy) return normalize(JSON.parse(legacy));
    } catch {}
    return { completed: {}, scores: {}, history: [] };
  }

  const state = read();
  window.PaperProgress = {
    state,
    key(courseId, levelIndex) { return `${courseId}:${levelIndex}`; },
    isComplete(courseId, levelIndex) { return Boolean(state.completed[this.key(courseId, levelIndex)]); },
    save() {
      const serialized = JSON.stringify(state);
      try {
        set(KEY, serialized);
        set('paperdev_progress_backup', serialized);
      } catch {}
      window.dispatchEvent(new CustomEvent('paperprogresschange'));
    },
    complete(courseId, levelIndex, score = 100, title = '', courseName = '') {
      const k = this.key(courseId, levelIndex);
      const now = new Date().toISOString();
      const wasDone = Boolean(state.completed[k]);
      state.completed[k] = { at: now };
      state.scores[k] = Math.max(0, Math.min(100, Number(score) || 0));
      if (!wasDone) {
        state.history.unshift({ course: courseName, title, at: now });
        state.history = state.history.slice(0, 200);
      }
      this.save();
      return !wasDone;
    }
  };

  // Migrate old state once into the new store.
  try { if (!get(KEY)) window.PaperProgress.save(); } catch {}
})();