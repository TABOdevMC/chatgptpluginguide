const COOKIE_NAME = 'paperdev_progress';
const THEME_COOKIE_NAME = 'paperdev_themes';
const PROFILE_COOKIE_NAME = 'paperdev_profile';
const COOKIE_DAYS = 365;
let progress = loadProgress();
let selectedThemes = loadThemes();
let profile = loadProfile();
let currentCourse = null;
let currentLevel = 0;
let onboardingStep = 0;
let onboardingAnswers = { level: null, goals: [], knowledge: [], strengths: [], weaknesses: [] };

const $ = (selector) => document.querySelector(selector);

const ASSESSMENT_STEPS = [
  {
    key: 'level',
    title: 'Quel est ton niveau en Java ?',
    description: 'Choisis la réponse qui correspond le mieux à ton expérience actuelle.',
    type: 'single',
    options: [
      ['beginner', 'Je débute complètement'],
      ['basic', "Je connais les bases : variables, conditions, boucles"],
      ['intermediate', 'Je sais déjà créer de petites applications Java'],
      ['advanced', 'Je suis à l’aise avec Java et la programmation orientée objet']
    ]
  },
  {
    key: 'goals',
    title: 'Qu’est-ce que tu veux apprendre ?',
    description: 'Tu peux sélectionner plusieurs objectifs.',
    type: 'multi',
    options: [
      ['plugin', 'Créer mon premier plugin Paper'],
      ['gameplay', 'Créer des mécaniques de gameplay'],
      ['commands', 'Créer des commandes et interfaces'],
      ['data', 'Gérer les données, configs et bases de données'],
      ['advanced', 'Faire des plugins avancés et optimisés']
    ]
  },
  {
    key: 'knowledge',
    title: 'Que connais-tu déjà de Paper ?',
    description: 'Sélectionne tout ce que tu as déjà utilisé.',
    type: 'multi',
    options: [
      ['java', 'Java'],
      ['gradle', 'Gradle / Maven'],
      ['plugin', 'JavaPlugin / plugin.yml'],
      ['events', 'Events / listeners'],
      ['scheduler', 'Scheduler / tâches'],
      ['pdc', 'PersistentDataContainer'],
      ['commands', 'Commandes'],
      ['none', 'Rien de tout cela']
    ]
  },
  {
    key: 'strengths',
    title: 'Quels sont tes points forts ?',
    description: 'Cela nous aide à éviter de te recommander uniquement ce que tu sais déjà.',
    type: 'multi',
    options: [
      ['logic', 'Logique / résolution de problèmes'],
      ['java', 'Java'],
      ['api', 'Comprendre une API'],
      ['debug', 'Debug / trouver des erreurs'],
      ['design', 'Créer des interfaces'],
      ['organization', 'Organisation du code']
    ]
  },
  {
    key: 'weaknesses',
    title: 'Sur quoi veux-tu progresser ?',
    description: 'Sélectionne tes principales difficultés.',
    type: 'multi',
    options: [
      ['java', 'Bases Java'],
      ['architecture', 'Architecture / organisation'],
      ['events', 'Events'],
      ['async', 'Scheduler / asynchrone'],
      ['data', 'Sauvegarde / données'],
      ['api', 'Comprendre les APIs Paper'],
      ['ui', 'Menus / UI / messages'],
      ['commands', 'Commandes / Brigadier'],
      ['performance', 'Performances']
    ]
  }
];

function cookieValue(name) {
  const row = document.cookie.split('; ').find(item => item.startsWith(name + '='));
  if (!row) return null;
  try { return decodeURIComponent(row.slice(name.length + 1)); }
  catch { return null; }
}

function writeCookie(name, value) {
  const maxAge = COOKIE_DAYS * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function deleteCookie(name) {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

function loadProgress() {
  try {
    const value = cookieValue(COOKIE_NAME);
    if (!value) return { completed: {}, scores: {}, history: [] };
    const parsed = JSON.parse(value);
    return {
      completed: parsed.completed || {},
      scores: parsed.scores || {},
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 30) : []
    };
  } catch {
    return { completed: {}, scores: {}, history: [] };
  }
}

function saveProgress() {
  writeCookie(COOKIE_NAME, JSON.stringify(progress));
  const status = $('#saveState');
  if (status) status.textContent = 'Progression sauvegardée dans ce navigateur';
}

function loadThemes() {
  try {
    const raw = cookieValue(THEME_COOKIE_NAME);
    if (!raw) return Object.keys(COURSES);
    const values = JSON.parse(raw);
    if (!Array.isArray(values)) return Object.keys(COURSES);
    const valid = values.filter(id => COURSES[id]);
    return valid.length ? valid : Object.keys(COURSES);
  } catch {
    return Object.keys(COURSES);
  }
}

function saveThemes() {
  if (!selectedThemes.length) selectedThemes = [Object.keys(COURSES)[0]];
  writeCookie(THEME_COOKIE_NAME, JSON.stringify(selectedThemes));
}

function loadProfile() {
  try {
    const raw = cookieValue(PROFILE_COOKIE_NAME);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.completedAt ? parsed : null;
  } catch {
    return null;
  }
}

function saveProfile() {
  writeCookie(PROFILE_COOKIE_NAME, JSON.stringify(profile));
}

function key(courseId, levelIndex) {
  return `${courseId}:${levelIndex}`;
}

function isComplete(courseId, levelIndex) {
  return !!progress.completed[key(courseId, levelIndex)];
}

function isUnlocked(courseId, levelIndex) {
  return levelIndex === 0 || isComplete(courseId, levelIndex - 1);
}

function visibleCourses() {
  return selectedThemes.map(id => COURSES[id]).filter(Boolean);
}

function totalLevels() {
  return Object.values(COURSES).reduce((sum, course) => sum + course.levels.length, 0);
}

function totalCompleted() {
  return Object.keys(progress.completed).filter(item => {
    const [courseId, level] = item.split(':');
    return COURSES[courseId] && COURSES[courseId].levels[Number(level)];
  }).length;
}

function render() {
  renderThemePanel();
  renderSkills();
  renderRecommendations();
  renderOverallProgress();
  if (!$('#progressView').classList.contains('hidden')) renderProgressPage();
  if (!$('#profileView').classList.contains('hidden')) renderProfilePage();
}

function renderOverallProgress() {
  const total = totalLevels();
  const done = totalCompleted();
  const pct = total ? done / total * 100 : 0;
  $('#overallBar').style.width = `${pct}%`;
  $('#overallLabel').textContent = `${done} / ${total} niveaux`;
}

function courseScore(course) {
  if (!profile) return 0;
  let score = 0;
  const text = `${course.id} ${course.name} ${course.description}`.toLowerCase();
  const goals = profile.goals || [];
  const knowledge = profile.knowledge || [];
  const strengths = profile.strengths || [];
  const weaknesses = profile.weaknesses || [];
  if (weaknesses.includes('java') && (course.id === 'java' || course.id === 'setup')) score += 8;
  if (weaknesses.includes('architecture') && (course.id === 'java' || course.id === 'data')) score += 5;
  if (weaknesses.includes('events') && course.id === 'events') score += 10;
  if (weaknesses.includes('async') && course.id === 'scheduler') score += 10;
  if (weaknesses.includes('data') && course.id === 'data') score += 10;
  if (weaknesses.includes('api') && (course.id === 'setup' || course.id === 'events')) score += 6;
  if (weaknesses.includes('ui') && ['ui','items','messages'].includes(course.id)) score += 10;
  if (weaknesses.includes('commands') && course.id === 'commands') score += 10;
  if (weaknesses.includes('performance') && course.id === 'performance') score += 10;
  if (goals.includes('plugin') && course.id === 'setup') score += 8;
  if (goals.includes('gameplay') && ['events','entities','blocks'].includes(course.id)) score += 7;
  if (goals.includes('commands') && ['commands','ui'].includes(course.id)) score += 7;
  if (goals.includes('data') && course.id === 'data') score += 8;
  if (goals.includes('advanced') && ['performance','commands','data'].includes(course.id)) score += 5;
  if (knowledge.includes('java') && course.id === 'java') score -= 6;
  if (knowledge.includes('events') && course.id === 'events') score -= 5;
  if (strengths.includes('java') && course.id === 'java') score -= 4;
  if (text.includes('paper') && goals.includes('plugin')) score += 1;
  if (profile.level === 'beginner' && ['java','setup'].includes(course.id)) score += 4;
  if (profile.level === 'advanced' && course.id === 'java') score -= 3;
  return score;
}

function recommendedCourses() {
  const courses = visibleCourses();
  return courses.map(course => ({ course, score: courseScore(course) }))
    .sort((a, b) => b.score - a.score);
}

function isRecommended(courseId) {
  if (!profile) return false;
  const ranked = recommendedCourses();
  return ranked.length > 0 && ranked.slice(0, Math.min(3, ranked.length)).some(item => item.course.id === courseId && item.score > 0);
}

function renderRecommendations() {
  const panel = $('#recommendationPanel');
  if (!panel) return;
  if (!profile) {
    panel.innerHTML = '<span class="eyebrow">RECOMMANDATIONS</span><h2>Pas encore de profil</h2><p class="muted">Réponds au petit questionnaire pour recevoir des recommandations personnalisées.</p>';
    return;
  }
  const ranked = recommendedCourses().filter(item => item.score > 0).slice(0, 3);
  if (!ranked.length) {
    panel.innerHTML = '<span class="eyebrow">RECOMMANDATIONS</span><h2>Parcours équilibré</h2><p class="muted">Ton profil ne favorise pas un seul thème. Tu peux suivre les parcours dans l’ordre.</p>';
    return;
  }
  panel.innerHTML = `<span class="eyebrow">RECOMMANDÉ POUR TOI</span><h2>Par où commencer ?</h2><p class="muted">Les cours marqués d’une ⭐ correspondent le mieux à ton diagnostic.</p><div class="recommend-list">${ranked.map(item => `<button class="recommend-item" data-recommend="${item.course.id}"><span>${item.course.icon}</span><span><strong>${escapeHtml(item.course.name)}</strong><small>${escapeHtml(item.course.description)}</small></span><b>⭐</b></button>`).join('')}</div>`;
  panel.querySelectorAll('[data-recommend]').forEach(btn => btn.addEventListener('click', () => openLesson(btn.dataset.recommend, firstAvailableLevel(btn.dataset.recommend))));
}

function firstAvailableLevel(courseId) {
  const course = COURSES[courseId];
  if (!course) return 0;
  const index = course.levels.findIndex((_, i) => !isComplete(courseId, i));
  return index === -1 ? course.levels.length - 1 : index;
}

function renderThemePanel() {
  const panel = $('#themePanel');
  if (!panel) return;
  const names = visibleCourses().map(course => `${course.icon} ${course.name}`);
  panel.innerHTML = `
    <div class="section-head">
      <div><span class="eyebrow">THÈMES ACTIFS</span><h2 id="themeTitle">${names.length ? names.join(' · ') : 'Aucun thème'}</h2></div>
      <button class="nav-btn" id="quickThemes">Modifier</button>
    </div>
    <p class="muted">Changer les thèmes ne supprime pas ta progression.</p>
  `;
  $('#quickThemes').addEventListener('click', openThemesView);
}

function renderThemeChooser() {
  const root = $('#themeChooser');
  if (!root) return;
  root.innerHTML = Object.values(COURSES).map(course => `
    <label class="theme-option">
      <input type="checkbox" value="${course.id}" ${selectedThemes.includes(course.id) ? 'checked' : ''}>
      <span class="theme-option-icon">${course.icon}</span>
      <span><strong>${escapeHtml(course.name)}</strong><small>${escapeHtml(course.description)}</small></span>
    </label>
  `).join('');
}

function readThemeSelection() {
  const values = [...document.querySelectorAll('#themeChooser input:checked')].map(input => input.value);
  if (!values.length) {
    showToast('Sélectionne au moins un thème.');
    return null;
  }
  return values;
}

function openThemesView() {
  renderThemeChooser();
  showView('themesView');
}

function renderSkills() {
  const grid = $('#skillGrid');
  grid.innerHTML = '';
  visibleCourses().forEach(course => {
    const done = course.levels.filter((_, i) => isComplete(course.id, i)).length;
    const pct = done / course.levels.length * 100;
    const target = firstAvailableLevel(course.id);
    const recommended = isRecommended(course.id);
    const card = document.createElement('article');
    card.className = 'card skill-card';
    card.innerHTML = `
      <div class="skill-icon">${course.icon}</div>
      ${recommended ? '<span class="recommend-star" title="Cours recommandé pour ton profil">⭐</span>' : ''}
      <div class="eyebrow">${escapeHtml(course.color)}</div>
      <h3>${escapeHtml(course.name)}</h3>
      <p>${escapeHtml(course.description)}</p>
      <div class="skill-meta"><span>${done}/${course.levels.length} niveaux</span><span>${Math.round(pct)}%</span></div>
      <div class="progress"><i style="width:${pct}%"></i></div>
      <button class="primary" data-open="${course.id}" data-level="${target}">${done === course.levels.length ? 'Revoir le parcours' : done === 0 ? 'Commencer' : 'Continuer'}</button>
    `;
    grid.appendChild(card);
  });
  grid.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => openLesson(btn.dataset.open, Number(btn.dataset.level))));
}

function showView(id) {
  ['homeView', 'themesView', 'progressView', 'profileView', 'lessonView'].forEach(viewId => {
    const view = $('#' + viewId);
    if (view) view.classList.toggle('hidden', viewId !== id);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openLesson(courseId, levelIndex) {
  const course = COURSES[courseId];
  if (!course || !selectedThemes.includes(courseId) || !isUnlocked(courseId, levelIndex)) return;
  currentCourse = courseId;
  currentLevel = levelIndex;
  showView('lessonView');
  renderLesson();
}

function renderLesson() {
  const course = COURSES[currentCourse];
  const lesson = course.levels[currentLevel];
  $('#lessonSkill').textContent = `${course.icon} ${course.name} · Niveau ${currentLevel + 1}/${course.levels.length}`;
  $('#lessonTitle').textContent = lesson.title;
  $('#lessonStatus').textContent = isComplete(currentCourse, currentLevel) ? '✓ Validé' : 'À apprendre';
  renderLevelList(course);
  renderLessonContent(course, lesson);
}

function renderLevelList(course) {
  const list = $('#levelList');
  list.innerHTML = '';
  course.levels.forEach((lesson, i) => {
    const unlocked = isUnlocked(course.id, i);
    const done = isComplete(course.id, i);
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    if (i === currentLevel) btn.classList.add('current');
    if (done) btn.classList.add('done');
    if (!unlocked) btn.classList.add('locked');
    btn.disabled = !unlocked;
    const shortTitle = lesson.title.replace(/^Niveau \d+ — /, '');
    btn.textContent = `${done ? '✓ ' : unlocked ? '' : '🔒 '}${i + 1}. ${shortTitle}`;
    if (unlocked) btn.addEventListener('click', () => { currentLevel = i; renderLesson(); });
    list.appendChild(btn);
  });
}

function renderLessonContent(course, lesson) {
  const completed = isComplete(course.id, currentLevel);
  const answers = lesson.a.map((answer, i) => `<button class="answer" data-choice="${i}">${escapeHtml(answer)}</button>`).join('');
  const score = progress.scores[key(course.id, currentLevel)] ?? 0;
  $('#lessonContent').innerHTML = `
    <div class="eyebrow">Cours</div>
    <h2>${escapeHtml(lesson.title)}</h2>
    <p>${escapeHtml(lesson.text)}</p>
    <div class="code-wrap"><button class="copy-btn" id="copyCode">Copier</button><pre><code>${escapeHtml(lesson.code)}</code></pre></div>
    <div class="tip"><strong>💡 À retenir</strong><br>${escapeHtml(lesson.tip)}</div>
    <section class="quiz">
      <div class="eyebrow">Test de validation</div>
      <h3>${escapeHtml(lesson.q)}</h3>
      <div class="answer-grid">${answers}</div>
      <div id="quizResult" class="quiz-result"></div>
      ${completed ? `<button class="next-btn" id="nextBtn">${currentLevel < course.levels.length - 1 ? 'Niveau suivant →' : 'Parcours terminé 🎉'}</button>` : ''}
      ${completed ? `<p class="muted">Résultat : ${score}%</p>` : ''}
    </section>
  `;
  $('#copyCode').addEventListener('click', () => copyText(lesson.code));
  $('#lessonContent').querySelectorAll('.answer').forEach(button => button.addEventListener('click', () => submitAnswer(Number(button.dataset.choice), button)));
  if (completed) $('#nextBtn').addEventListener('click', nextLevel);
}

function submitAnswer(choice, clickedButton) {
  const course = COURSES[currentCourse];
  const lesson = course.levels[currentLevel];
  const buttons = [...$('#lessonContent').querySelectorAll('.answer')];
  const result = $('#quizResult');
  buttons.forEach(btn => btn.disabled = true);
  if (choice === lesson.correct) {
    buttons[lesson.correct].classList.add('correct');
    result.className = 'quiz-result result-ok';
    result.textContent = '✓ Bonne réponse ! Niveau validé.';
    const lessonKey = key(currentCourse, currentLevel);
    const wasAlreadyDone = isComplete(currentCourse, currentLevel);
    progress.completed[lessonKey] = { at: new Date().toISOString() };
    progress.scores[lessonKey] = 100;
    if (!wasAlreadyDone) {
      progress.history.unshift({ course: course.name, title: lesson.title, at: new Date().toISOString() });
      progress.history = progress.history.slice(0, 30);
    }
    saveProgress();
    renderSkills();
    renderRecommendations();
    renderOverallProgress();
    $('#lessonStatus').textContent = '✓ Validé';
    renderLevelList(course);
    if (!$('#nextBtn')) {
      const next = document.createElement('button');
      next.className = 'next-btn';
      next.id = 'nextBtn';
      next.textContent = currentLevel < course.levels.length - 1 ? 'Niveau suivant →' : 'Parcours terminé 🎉';
      next.addEventListener('click', nextLevel);
      $('#lessonContent .quiz').appendChild(next);
    }
    showToast('Niveau validé !');
  } else {
    clickedButton.classList.add('wrong');
    result.className = 'quiz-result result-bad';
    result.textContent = '✗ Mauvaise réponse. Relis le cours et réessaie.';
    buttons.forEach(btn => btn.disabled = false);
  }
}

function nextLevel() {
  const course = COURSES[currentCourse];
  if (currentLevel < course.levels.length - 1) {
    currentLevel++;
    renderLesson();
  } else {
    showToast('Bravo, parcours terminé !');
    showView('progressView');
    renderProgressPage();
  }
}

function renderProgressPage() {
  const completed = totalCompleted();
  const total = totalLevels();
  const allCourses = Object.values(COURSES);
  const finishedCourses = allCourses.filter(course => course.levels.every((_, i) => isComplete(course.id, i))).length;
  const stats = $('#statsGrid');
  stats.innerHTML = `
    <div class="card"><div class="muted">Niveaux terminés</div><div class="stat">${completed}/${total}</div></div>
    <div class="card"><div class="muted">Progression</div><div class="stat">${total ? Math.round(completed / total * 100) : 0}%</div></div>
    <div class="card"><div class="muted">Parcours terminés</div><div class="stat">${finishedCourses}/${allCourses.length}</div></div>
    <div class="card"><div class="muted">Thèmes actifs</div><div class="stat">${selectedThemes.length}</div></div>
  `;
  $('#history').innerHTML = progress.history.length
    ? progress.history.map(item => `<div class="history-row"><span>✓ ${escapeHtml(item.course)} — ${escapeHtml(item.title)}</span><span class="muted">${formatDate(item.at)}</span></div>`).join('')
    : '<p class="muted">Aucun niveau validé pour le moment.</p>';
}

function renderProfilePage() {
  const root = $('#profileContent');
  if (!root) return;
  if (!profile) {
    root.innerHTML = '<div class="card"><h2>Profil indisponible</h2><p class="muted">Fais le questionnaire pour obtenir des recommandations personnalisées.</p></div>';
    return;
  }
  const labels = {
    level: { beginner: 'Débutant', basic: 'Bases', intermediate: 'Intermédiaire', advanced: 'Avancé' },
    goals: { plugin: 'Premier plugin', gameplay: 'Gameplay', commands: 'Commandes & interfaces', data: 'Données', advanced: 'Plugins avancés' },
    knowledge: { java: 'Java', gradle: 'Gradle / Maven', plugin: 'Plugin Paper', events: 'Events', scheduler: 'Scheduler', pdc: 'PDC', commands: 'Commandes' },
    strengths: { logic: 'Logique', java: 'Java', api: 'APIs', debug: 'Debug', design: 'Design', organization: 'Organisation' },
    weaknesses: { java: 'Java', architecture: 'Architecture', events: 'Events', async: 'Scheduler / async', data: 'Données', api: 'APIs Paper', ui: 'UI', commands: 'Commandes', performance: 'Performances' }
  };
  const tags = (items, group) => (items || []).map(item => `<span class="profile-tag">${escapeHtml(labels[group]?.[item] || item)}</span>`).join('');
  root.innerHTML = `
    <div class="profile-grid">
      <div class="card"><div class="eyebrow">NIVEAU ESTIMÉ</div><h2>${labels.level[profile.level] || '—'}</h2></div>
      <div class="card"><div class="eyebrow">OBJECTIFS</div><div class="tag-list">${tags(profile.goals, 'goals') || '<span class="muted">Non renseigné</span>'}</div></div>
      <div class="card"><div class="eyebrow">CONNAISSANCES</div><div class="tag-list">${tags(profile.knowledge, 'knowledge') || '<span class="muted">Aucune</span>'}</div></div>
      <div class="card"><div class="eyebrow">POINTS FORTS</div><div class="tag-list">${tags(profile.strengths, 'strengths') || '<span class="muted">Non renseigné</span>'}</div></div>
      <div class="card"><div class="eyebrow">À TRAVAILLER</div><div class="tag-list">${tags(profile.weaknesses, 'weaknesses') || '<span class="muted">Non renseigné</span>'}</div></div>
    </div>
  `;
}

function resetProgress() {
  if (!confirm('Réinitialiser toute ta progression ? Le profil et les thèmes seront conservés.')) return;
  progress = { completed: {}, scores: {}, history: [] };
  deleteCookie(COOKIE_NAME);
  saveProgress();
  currentCourse = null;
  currentLevel = 0;
  showView('homeView');
  render();
  showToast('Progression réinitialisée.');
}

function copyText(text) {
  if (!navigator.clipboard) return showToast('Copie non disponible.');
  navigator.clipboard.writeText(text).then(() => showToast('Code copié !')).catch(() => showToast('Copie non disponible.'));
}

function formatDate(value) {
  try { return new Intl.DateTimeFormat('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }).format(new Date(value)); }
  catch { return ''; }
}

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
}

function openOnboarding() {
  onboardingStep = 0;
  onboardingAnswers = { level: null, goals: [], knowledge: [], strengths: [], weaknesses: [] };
  $('#onboarding').classList.remove('hidden');
  renderOnboardingStep();
}

function renderOnboardingStep() {
  const step = ASSESSMENT_STEPS[onboardingStep];
  const progressPct = ((onboardingStep + 1) / ASSESSMENT_STEPS.length) * 100;
  $('#onboardingBar').style.width = `${progressPct}%`;
  $('#onboardingStepLabel').textContent = `DIAGNOSTIC · ${onboardingStep + 1}/${ASSESSMENT_STEPS.length}`;
  $('#onboardingTitle').textContent = step.title;
  $('#onboardingDescription').textContent = step.description;
  const selected = onboardingAnswers[step.key];
  $('#onboardingBody').innerHTML = step.options.map(([value, label]) => {
    const active = step.type === 'single' ? selected === value : selected.includes(value);
    return `<label class="assessment-option ${active ? 'selected' : ''}"><input type="${step.type === 'single' ? 'radio' : 'checkbox'}" name="assessment" value="${value}" ${active ? 'checked' : ''}><span>${escapeHtml(label)}</span></label>`;
  }).join('');
  $('#onboardingBack').disabled = onboardingStep === 0;
  $('#onboardingNext').textContent = onboardingStep === ASSESSMENT_STEPS.length - 1 ? 'Terminer' : 'Continuer';
  $('#onboardingBody').querySelectorAll('input').forEach(input => input.addEventListener('change', () => collectOnboardingStep(step)));
}

function collectOnboardingStep(step) {
  if (step.type === 'single') {
    const input = $('#onboardingBody input:checked');
    onboardingAnswers[step.key] = input ? input.value : null;
  } else {
    onboardingAnswers[step.key] = [...$('#onboardingBody input:checked')].map(input => input.value);
  }
  renderOnboardingStep();
}

function goOnboardingNext() {
  const step = ASSESSMENT_STEPS[onboardingStep];
  if (step.type === 'single' && !onboardingAnswers[step.key]) {
    showToast('Choisis une réponse avant de continuer.');
    return;
  }
  if (step.type === 'multi' && !onboardingAnswers[step.key]?.length) {
    showToast('Sélectionne au moins une réponse.');
    return;
  }
  if (onboardingStep < ASSESSMENT_STEPS.length - 1) {
    onboardingStep++;
    renderOnboardingStep();
    return;
  }
  profile = { ...onboardingAnswers, completedAt: new Date().toISOString() };
  saveProfile();
  $('#onboarding').classList.add('hidden');
  render();
  showToast('Profil créé ! Tes recommandations sont prêtes.');
}

function goOnboardingBack() {
  if (onboardingStep === 0) return;
  onboardingStep--;
  renderOnboardingStep();
}

function startAssessmentAgain() {
  openOnboarding();
}

$('#onboardingNext').addEventListener('click', goOnboardingNext);
$('#onboardingBack').addEventListener('click', goOnboardingBack);
$('#retakeBtn').addEventListener('click', startAssessmentAgain);

$('#saveThemes').addEventListener('click', () => {
  const values = readThemeSelection();
  if (!values) return;
  selectedThemes = values;
  saveThemes();
  showView('homeView');
  render();
  showToast('Thèmes mis à jour.');
});

$('#selectAllThemes').addEventListener('click', () => {
  document.querySelectorAll('#themeChooser input').forEach(input => input.checked = true);
});

document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.view === 'home') { showView('homeView'); render(); }
    if (btn.dataset.view === 'progress') { showView('progressView'); renderProgressPage(); }
    if (btn.dataset.view === 'themes') openThemesView();
    if (btn.dataset.view === 'profile') { showView('profileView'); renderProfilePage(); }
  });
});

$('#backBtn').addEventListener('click', () => { showView('homeView'); render(); });
$('#resetBtn').addEventListener('click', resetProgress);

saveProgress();
render();
if (!profile) openOnboarding();
