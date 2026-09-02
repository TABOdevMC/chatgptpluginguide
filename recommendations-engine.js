// Moteur de recommandations unifié pour PaperDev Academy.
(function () {
  'use strict';

  const PROFILE_TAGS = {
    java: ['java', 'logic', 'organization'],
    setup: ['java', 'plugin', 'organization', 'debug'],
    events: ['events', 'api', 'logic'],
    scheduler: ['scheduler', 'async', 'debug', 'logic'],
    data: ['pdc', 'data', 'organization', 'logic'],
    items: ['pdc', 'items', 'api', 'ui'],
    ui: ['plugin', 'ui', 'design', 'api'],
    world: ['plugin', 'world', 'api', 'logic'],
    commands: ['commands', 'api', 'logic'],
    quality: ['plugin', 'debug', 'organization', 'performance'],
    gradle: ['java', 'gradle', 'build', 'organization'],
    config: ['plugin', 'config', 'organization'],
    menu: ['ui', 'menus', 'inventory', 'design', 'items'],
    scoreboard: ['ui', 'scoreboard', 'teams', 'design'],
    javaadvanced: ['java', 'architecture', 'debug', 'testing'],
    worldblocks: ['world', 'blocks', 'api'],
    entities: ['world', 'entities', 'mobs', 'api']
  };

  const LEVEL_WEIGHT = { beginner: 4, basic: 3, intermediate: 2, advanced: 1 };

  function courseFinished(course) {
    return !!course && course.levels.length > 0 && course.levels.every((_, i) => isComplete(course.id, i));
  }

  function normalize(values) {
    return new Set((values || []).map(value => String(value).toLowerCase()));
  }

  function courseScore(course) {
    if (!profile || !course || courseFinished(course)) return -Infinity;

    const tags = new Set((PROFILE_TAGS[course.id] || []).map(x => x.toLowerCase()));
    const goals = normalize(profile.goals);
    const knowledge = normalize(profile.knowledge);
    const strengths = normalize(profile.strengths);
    const weaknesses = normalize(profile.weaknesses);
    const text = `${course.id} ${course.name} ${course.description}`.toLowerCase();
    let score = 0;

    tags.forEach(tag => {
      if (goals.has(tag)) score += 8;
      if (knowledge.has(tag)) score += 5;
      if (strengths.has(tag)) score += 2;
      if (weaknesses.has(tag)) score += 7;
    });

    [...goals, ...knowledge, ...strengths, ...weaknesses].forEach(tag => {
      if (tag && text.includes(tag)) score += weaknesses.has(tag) ? 4 : 2;
    });

    const targetLevel = profile.adaptiveLevel || profile.level;
    if (targetLevel && course.level) {
      score += LEVEL_WEIGHT[course.level] === LEVEL_WEIGHT[targetLevel] ? 3 : 0;
    }

    const done = course.levels.filter((_, i) => isComplete(course.id, i)).length;
    if (done > 0) score += 2;
    score += Math.max(0, 3 - done);

    return score;
  }

  function rankedRecommendations() {
    return Object.values(COURSES)
      .filter(course => !courseFinished(course))
      .map(course => ({ course, score: courseScore(course) }))
      .sort((a, b) => b.score - a.score || a.course.name.localeCompare(b.course.name, 'fr'));
  }

  function renderRecommendationsFixed() {
    const root = document.querySelector('#recommendationPanel');
    if (!root) return;

    if (!profile) {
      root.innerHTML = '<div><span class="eyebrow">RECOMMANDATIONS</span><h2>Ton parcours personnalisé</h2><p class="muted">Complète le diagnostic pour obtenir des recommandations adaptées à ton niveau.</p></div>';
      return;
    }

    const ranked = rankedRecommendations();
    const usable = ranked.filter(item => Number.isFinite(item.score));

    if (!usable.length) {
      root.innerHTML = '<div class="recommendation-empty"><span class="eyebrow">RECOMMANDATIONS</span><h2>Tu as terminé tous les parcours 🎉</h2><p class="muted">Tous les parcours disponibles sont validés. De nouveaux contenus pourront s’ajouter sans perdre ta progression.</p></div>';
      return;
    }

    const top = usable.slice(0, 3);
    root.innerHTML = `<div><span class="eyebrow">RECOMMANDATIONS</span><h2>Les prochains cours à travailler</h2><p class="muted">Basé sur ton profil, tes points faibles et ta progression actuelle.</p><div class="recommend-list">${top.map(({course, score}, index) => {
      const done = course.levels.filter((_, i) => isComplete(course.id, i)).length;
      const level = firstAvailableLevel(course.id);
      return `<button class="recommend-item" data-open="${course.id}" data-level="${level}"><b>${index === 0 ? '⭐' : '→'}</b><span><strong>${escapeHtml(course.name)}</strong><small>${done}/${course.levels.length} niveaux · priorité ${Math.max(1, Math.min(99, score))}</small></span><span>›</span></button>`;
    }).join('')}</div></div>`;

    root.querySelectorAll('[data-open]').forEach(button => {
      button.addEventListener('click', () => openLesson(button.dataset.open, Number(button.dataset.level)));
    });
  }

  function isRecommendedFixed(courseId) {
    const ranked = rankedRecommendations();
    const first = ranked.find(item => Number.isFinite(item.score));
    return !!first && first.course.id === courseId;
  }

  window.PAPERDEV_RECOMMENDATIONS = { rankedRecommendations };
  window.renderRecommendations = renderRecommendationsFixed;
  window.isRecommended = isRecommendedFixed;

  window.addEventListener('paperprogresschange', () => setTimeout(renderRecommendationsFixed, 0));
  window.addEventListener('DOMContentLoaded', renderRecommendationsFixed);
  setTimeout(renderRecommendationsFixed, 0);
  setTimeout(renderRecommendationsFixed, 250);
  setTimeout(renderRecommendationsFixed, 1000);
})();
