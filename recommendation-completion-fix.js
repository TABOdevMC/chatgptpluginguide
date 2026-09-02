(() => {
  'use strict';

  function isCourseFinished(courseId) {
    try {
      const course = typeof COURSES !== 'undefined' ? COURSES[courseId] : null;
      if (!course) return false;
      return course.levels.length > 0 && course.levels.every((_, index) => {
        const key = `${courseId}:${index}`;
        try {
          if (typeof progress !== 'undefined' && progress?.completed) {
            return Object.prototype.hasOwnProperty.call(progress.completed, key);
          }
        } catch {}
        try {
          return !!window.progress?.completed && Object.prototype.hasOwnProperty.call(window.progress.completed, key);
        } catch { return false; }
      });
    } catch { return false; }
  }

  function isCourseCompletedFromCard(card) {
    const button = card?.querySelector?.('[data-open]');
    return !!button && isCourseFinished(button.dataset.open);
  }

  function cleanSkillCards() {
    document.querySelectorAll('#skillGrid .skill-card').forEach(card => {
      if (isCourseCompletedFromCard(card)) {
        card.querySelectorAll('.recommend-star').forEach(star => star.remove());
      }
    });
  }

  function cleanRecommendationPanel() {
    const panel = document.querySelector('#recommendationPanel');
    if (!panel) return;

    const candidates = [...panel.querySelectorAll('[data-open]')];
    candidates.forEach(node => {
      const courseId = node.dataset.open;
      const wrapper = node.closest('article, .card, .recommendation-item, .recommend-card, li, div');
      if (isCourseFinished(courseId)) {
        (wrapper || node).hidden = true;
      }
    });

    const visible = candidates.filter(node => {
      const wrapper = node.closest('article, .card, .recommendation-item, .recommend-card, li, div') || node;
      return !wrapper.hidden && !isCourseFinished(node.dataset.open);
    });

    if (candidates.length && visible.length === 0) {
      panel.innerHTML = '<div class="recommendation-empty"><span class="eyebrow">RECOMMANDATIONS</span><h3>Tous les parcours recommandés sont terminés 🎉</h3><p class="muted">Ton profil continuera à proposer de nouveaux parcours dès que des niveaux restent à apprendre.</p></div>';
    }
  }

  function clean() {
    try { cleanSkillCards(); } catch {}
    try { cleanRecommendationPanel(); } catch {}
  }

  window.addEventListener('paperprogresschange', () => setTimeout(clean, 0));
  window.addEventListener('DOMContentLoaded', clean);
  setTimeout(clean, 0);
  setTimeout(clean, 300);
  setTimeout(clean, 1000);
  setTimeout(clean, 2000);

  try {
    const observer = new MutationObserver(() => clean());
    observer.observe(document.body, { childList: true, subtree: true });
  } catch {}
})();
