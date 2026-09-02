(() => {
  'use strict';

  const getCourses = () => {
    try { return typeof COURSES !== 'undefined' ? Object.values(COURSES) : []; } catch { return []; }
  };
  const getCatalog = () => {
    try { return typeof BADGE_CATALOG !== 'undefined' ? BADGE_CATALOG : []; } catch { return []; }
  };

  const levelDone = (courseId, index) => {
    const key = `${courseId}:${index}`;
    try {
      if (typeof progress !== 'undefined' && progress?.completed && Object.prototype.hasOwnProperty.call(progress.completed, key)) return true;
    } catch {}
    try {
      if (window.progress?.completed && Object.prototype.hasOwnProperty.call(window.progress.completed, key)) return true;
    } catch {}
    try { return typeof isComplete === 'function' && isComplete(courseId, index); } catch { return false; }
  };

  const stats = () => {
    const courses = getCourses();
    const total = courses.reduce((n, c) => n + c.levels.length, 0);
    let done = 0;
    courses.forEach(c => c.levels.forEach((_, i) => { if (levelDone(c.id, i)) done++; }));
    const finished = courses.filter(c => c.levels.every((_, i) => levelDone(c.id, i))).length;
    const streak = (() => { try { return typeof learningStreak === 'function' ? learningStreak() : {current:0,active:false}; } catch { return {current:0,active:false}; } })();
    return { total, done, pct: total ? Math.round(done / total * 100) : 0, finished, totalCourses: courses.length, streak: streak.current || 0, activeStreak: !!streak.active };
  };

  const unlockedBadges = s => getCatalog().filter(b => { try { return !!b.test(s); } catch { return false; } });

  function renderBadgeGrid() {
    const root = document.querySelector('#badgeGrid');
    const catalog = getCatalog();
    if (!root || !catalog.length) return;
    const s = stats();
    const unlocked = new Set(unlockedBadges(s).map(b => b.id));
    const escSafe = value => typeof esc === 'function' ? esc(value) : String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    root.innerHTML = catalog.map(b => {
      const ok = unlocked.has(b.id);
      let goal = '';
      try { goal = typeof b.goal === 'function' ? (b.goal(s) || '') : ''; } catch {}
      let icon = ok ? '🏅' : '🔒';
      try { if (typeof badgeIcon === 'function') icon = badgeIcon(b.type, !ok); } catch {}
      return `<article class="badge-card-v2 ${ok ? 'earned' : 'locked'}" tabindex="0" title="${escSafe(b.desc)}"><div class="badge-art">${icon}</div><div class="badge-copy"><strong>${escSafe(b.name)}</strong><p>${escSafe(b.desc)}</p><small class="badge-goal">${escSafe(ok ? '✓ Débloqué' : `🔒 ${goal}`)}</small></div><span class="badge-pill">${ok ? 'Débloqué' : 'Encore à débloquer'}</span></article>`;
    }).join('');
    const count = document.querySelector('#badgeCount');
    if (count) count.textContent = `${unlocked.size}/${catalog.length}`;
  }

  window.badgeStats = stats;
  window.earnedBadges = () => unlockedBadges(stats());
  window.drawBadges = renderBadgeGrid;

  function refresh() {
    renderBadgeGrid();
    try { if (typeof renderOverallProgress === 'function') renderOverallProgress(); } catch {}
  }

  window.addEventListener('paperprogresschange', refresh);
  window.addEventListener('DOMContentLoaded', refresh);
  setTimeout(refresh, 0);
  setTimeout(refresh, 300);
  setTimeout(refresh, 1000);
  setTimeout(refresh, 2000);
})();
