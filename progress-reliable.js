(() => {
  // Stockage de progression robuste : un cookie par parcours + un cookie d'historique.
  // Les fonctions de l'application principale restent utilisées pour l'affichage.
  const DAYS = 365;
  const PREFIX = 'paperdev_course_';
  const HISTORY = 'paperdev_history';

  const readCookie = (name) => {
    const row = document.cookie.split('; ').find(x => x.startsWith(name + '='));
    if (!row) return null;
    try { return decodeURIComponent(row.slice(name.length + 1)); } catch { return null; }
  };
  const writeCookie = (name, value) => {
    document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${DAYS * 86400}; Path=/; SameSite=Lax`;
  };
  const eraseCookie = (name) => {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  };

  const safeState = () => {
    try {
      return globalThis.eval('progress');
    } catch {
      return { completed: {}, scores: {}, history: [] };
    }
  };

  const setState = (state) => {
    try { globalThis.eval(`progress = ${JSON.stringify(state)}`); } catch {}
  };

  function readCourse(courseId) {
    const raw = readCookie(PREFIX + courseId);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch { return null; }
  }

  function readHistory() {
    const raw = readCookie(HISTORY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.slice(0, 100) : [];
    } catch { return []; }
  }

  function saveAll() {
    const state = safeState();
    const courses = Object.values(globalThis.COURSES || {});
    const byCourse = {};

    for (const course of courses) {
      const completed = {};
      const scores = {};
      for (let i = 0; i < course.levels.length; i++) {
        const key = `${course.id}:${i}`;
        if (state.completed && state.completed[key]) completed[i] = state.completed[key];
        if (state.scores && state.scores[key] !== undefined) scores[i] = state.scores[key];
      }
      if (Object.keys(completed).length || Object.keys(scores).length) {
        const payload = JSON.stringify({ completed, scores });
        writeCookie(PREFIX + course.id, payload);
        byCourse[course.id] = true;
      }
    }

    writeCookie(HISTORY, JSON.stringify(state.history || []));
    return byCourse;
  }

  function restoreAll() {
    const state = safeState();
    let restored = false;
    const courses = Object.values(globalThis.COURSES || {});
    const completed = { ...(state.completed || {}) };
    const scores = { ...(state.scores || {}) };

    for (const course of courses) {
      const stored = readCourse(course.id);
      if (!stored) continue;
      restored = true;
      for (const [index, value] of Object.entries(stored.completed || {})) {
        completed[`${course.id}:${index}`] = value;
      }
      for (const [index, value] of Object.entries(stored.scores || {})) {
        scores[`${course.id}:${index}`] = value;
      }
    }

    const history = readHistory();
    const mergedHistory = history.length ? history : (state.history || []);
    if (restored || history.length) {
      setState({ completed, scores, history: mergedHistory.slice(0, 100) });
    }
    return restored || history.length;
  }

  function clearAll() {
    for (const course of Object.values(globalThis.COURSES || {})) {
      eraseCookie(PREFIX + course.id);
    }
    eraseCookie(HISTORY);
  }

  // L'application principale vient juste d'être chargée : on restaure nos cookies dédiés.
  const restored = restoreAll();
  if (restored && typeof globalThis.render === 'function') {
    try { globalThis.render(); } catch {}
  }

  // Chaque réussite met à jour immédiatement les cookies par parcours.
  const observer = new MutationObserver(() => {
    const result = document.querySelector('#quizResult');
    if (!result || !result.classList.contains('result-ok')) return;
    saveAll();
  });
  const lessonRoot = document.querySelector('#lessonContent');
  if (lessonRoot) observer.observe(lessonRoot, { childList: true, subtree: true, characterData: true });

  // Sécurité supplémentaire : sauvegarde après chaque clic de réponse.
  document.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.matches('.answer')) {
      window.setTimeout(saveAll, 60);
    }
  }, true);

  const resetButton = document.querySelector('#resetBtn');
  if (resetButton) resetButton.addEventListener('click', () => window.setTimeout(clearAll, 100));

  // Expose uniquement des outils de diagnostic non destructifs.
  globalThis.paperDevStorage = { saveAll, restoreAll, clearAll };
})();
