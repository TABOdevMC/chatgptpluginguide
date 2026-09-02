(() => {
  'use strict';

  const PROFILE_STORAGE_KEY = 'paperdev_profile_v4';

  const COURSE_SKILLS = {
    java: { knowledge: ['java'], strengths: ['logic', 'java', 'organization'], weakness: 'java' },
    setup: { knowledge: ['java', 'gradle', 'plugin'], strengths: ['organization', 'debug'], weakness: 'api' },
    events: { knowledge: ['events'], strengths: ['api', 'logic'], weakness: 'events' },
    scheduler: { knowledge: ['scheduler'], strengths: ['logic', 'debug'], weakness: 'async' },
    data: { knowledge: ['pdc'], strengths: ['organization', 'logic'], weakness: 'data' },
    items: { knowledge: ['pdc'], strengths: ['api', 'logic'], weakness: 'ui' },
    ui: { knowledge: ['plugin'], strengths: ['api', 'design'], weakness: 'ui' },
    world: { knowledge: ['plugin'], strengths: ['api', 'logic'], weakness: 'api' },
    commands: { knowledge: ['commands'], strengths: ['api', 'logic'], weakness: 'commands' },
    quality: { knowledge: ['plugin'], strengths: ['debug', 'organization'], weakness: 'performance' }
  };

  const LEVELS = ['beginner', 'basic', 'intermediate', 'advanced'];
  const LABELS = { beginner: 'Débutant', basic: 'Bases', intermediate: 'Intermédiaire', advanced: 'Avancé' };

  function unique(values) { return [...new Set((values || []).filter(Boolean))]; }

  function masteryPercent() {
    try {
      const total = Object.values(COURSES).reduce((sum, course) => sum + course.levels.length, 0);
      const done = typeof totalCompleted === 'function' ? totalCompleted() : Object.keys(progress?.completed || {}).length;
      return total ? Math.round(done / total * 100) : 0;
    } catch { return 0; }
  }

  function getAdaptiveLevel(oldLevel, pct) {
    const oldIndex = Math.max(0, LEVELS.indexOf(oldLevel));
    let learnedIndex = 0;
    if (pct >= 75) learnedIndex = 3;
    else if (pct >= 50) learnedIndex = 2;
    else if (pct >= 25) learnedIndex = 1;
    return LEVELS[Math.max(oldIndex, learnedIndex)];
  }

  function saveAdaptiveProfile() {
    try { localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile)); } catch {}
    try {
      document.cookie = `paperdev_profile=${encodeURIComponent(JSON.stringify(profile))}; Max-Age=${365 * 86400}; Path=/; SameSite=Lax`;
    } catch {}
  }

  function updateProfileFromCourse(courseId) {
    if (!profile || !COURSES[courseId]) return false;

    const skill = COURSE_SKILLS[courseId] || { knowledge: [], strengths: [], weakness: null };
    const beforeLevel = profile.level;
    const beforeKnowledge = JSON.stringify(profile.knowledge || []);
    const beforeStrengths = JSON.stringify(profile.strengths || []);
    const beforeWeaknesses = JSON.stringify(profile.weaknesses || []);

    profile.knowledge = unique([...(profile.knowledge || []), ...skill.knowledge]);
    profile.strengths = unique([...(profile.strengths || []), ...skill.strengths]);

    if (skill.weakness && Array.isArray(profile.weaknesses)) {
      profile.weaknesses = profile.weaknesses.filter(item => item !== skill.weakness);
    }

    const pct = masteryPercent();
    profile.level = getAdaptiveLevel(profile.level, pct);
    profile.adaptiveLevel = profile.level;
    profile.mastery = pct;
    profile.lastLearningAt = new Date().toISOString();
    profile.learningEvidence = profile.learningEvidence || {};
    profile.learningEvidence.byCourse = profile.learningEvidence.byCourse || {};
    profile.learningEvidence.byCourse[courseId] = (profile.learningEvidence.byCourse[courseId] || 0) + 1;
    profile.updatedAt = new Date().toISOString();

    const changed = true;
    saveAdaptiveProfile();

    try {
      if (typeof renderProfilePage === 'function') renderProfilePage();
      if (typeof renderRecommendations === 'function') renderRecommendations();
    } catch {}

    if (beforeLevel !== profile.level) {
      const label = LABELS[profile.level] || profile.level;
      try { if (typeof showToast === 'function') showToast(`📈 Profil mis à jour : niveau ${label} (${pct}% de maîtrise)`); } catch {}
    } else if (beforeKnowledge !== JSON.stringify(profile.knowledge) || beforeStrengths !== JSON.stringify(profile.strengths) || beforeWeaknesses !== JSON.stringify(profile.weaknesses)) {
      try { if (typeof showToast === 'function') showToast(`🧠 Profil mis à jour : ${COURSES[courseId].name} ajouté à tes compétences`); } catch {}
    }

    return changed;
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('.answer');
    if (!button) return;

    setTimeout(() => {
      try {
        if (!currentCourse || !profile) return;
        const courseId = currentCourse;
        const levelIndex = Number(currentLevel);
        if (typeof isComplete !== 'function' || !isComplete(courseId, levelIndex)) return;

        const evidenceKey = `${courseId}:${levelIndex}`;
        profile.learningEvidence = profile.learningEvidence || {};
        const validated = profile.learningEvidence.validatedLevels || [];
        if (validated.includes(evidenceKey)) return;
        profile.learningEvidence.validatedLevels = unique([...validated, evidenceKey]);
        updateProfileFromCourse(courseId);
      } catch (error) {
        console.error('Erreur profil adaptatif:', error);
      }
    }, 0);
  }, true);

  try {
    if (profile && !profile.adaptiveLevel) {
      profile.adaptiveLevel = profile.level;
      profile.mastery = masteryPercent();
      profile.learningEvidence = profile.learningEvidence || {};
      profile.learningEvidence.validatedLevels = profile.learningEvidence.validatedLevels || [];
      saveAdaptiveProfile();
    }
  } catch {}
})();
