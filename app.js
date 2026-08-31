const COOKIE_NAME = 'paperdev_progress';
const THEME_COOKIE_NAME = 'paperdev_themes';
const COOKIE_DAYS = 365;
let progress = loadProgress();
let selectedThemes = loadThemes();
let currentCourse = null;
let currentLevel = 0;

const $ = (selector) => document.querySelector(selector);

function cookieValue(name) {
  const row = document.cookie.split('; ').find(item => item.startsWith(name + '='));
  if (!row) return null;
  return decodeURIComponent(row.slice(name.length + 1));
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
  const payload = encodeURIComponent(JSON.stringify(progress));
  const maxAge = COOKIE_DAYS * 24 * 60 * 60;
  document.cookie = `${COOKIE_NAME}=${payload}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  const status = $('#saveState');
  if (status) status.textContent = 'Progression sauvegardée dans ce navigateur';
}

function loadThemes() {
  try {
    const raw = cookieValue(THEME_COOKIE_NAME);
    if (!raw) return Object.keys(COURSES);
    const themes = JSON.parse(raw);
    if (!Array.isArray(themes)) return Object.keys(COURSES);
    const valid = themes.filter(id => COURSES[id]);
    return valid.length ? valid : Object.keys(COURSES);
  } catch {
    return Object.keys(COURSES);
  }
}

function saveThemes() {
  if (!selectedThemes.length) selectedThemes = [Object.keys(COURSES)[0]];
  const payload = encodeURIComponent(JSON.stringify(selectedThemes));
  const maxAge = COOKIE_DAYS * 24 * 60 * 60;
  document.cookie = `${THEME_COOKIE_NAME}=${payload}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  render();
  showToast(`${selectedThemes.length} thème${selectedThemes.length > 1 ? 's' : ''} sélectionné${selectedThemes.length > 1 ? 's' : ''}.`);
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
  renderOverallProgress();
  if (!$('#progressView').classList.contains('hidden')) renderProgressPage();
}

function renderOverallProgress() {
  const total = totalLevels();
  const done = totalCompleted();
  const pct = total ? done / total * 100 : 0;
  $('#overallBar').style.width = `${pct}%`;
  $('#overallLabel').textContent = `${done} / ${total} niveaux`;
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
  $('#quickThemes').addEventListener('click', () => openThemesView());
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
    const firstIncomplete = course.levels.findIndex((_, i) => !isComplete(course.id, i));
    const target = firstIncomplete === -1 ? course.levels.length - 1 : firstIncomplete;
    const card = document.createElement('article');
    card.className = 'card skill-card';
    card.innerHTML = `
      <div class="skill-icon">${course.icon}</div>
      <div class="eyebrow">${escapeHtml(course.color)}</div>
      <h3>${escapeHtml(course.name)}</h3>
      <p>${escapeHtml(course.description)}</p>
      <div class="skill-meta"><span>${done}/${course.levels.length} niveaux</span><span>${Math.round(pct)}%</span></div>
      <div class="progress"><i style="width:${pct}%"></i></div>
      <button class="primary" data-open="${course.id}" data-level="${target}">${done === course.levels.length ? 'Revoir le parcours' : done === 0 ? 'Commencer' : 'Continuer'}</button>
    `;
    grid.appendChild(card);
  });
  grid.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => openLesson(btn.dataset.open, Number(btn.dataset.level)));
  });
}

function showView(id) {
  ['homeView', 'themesView', 'progressView', 'lessonView'].forEach(viewId => {
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
  $('#lessonContent').querySelectorAll('.answer').forEach(button => {
    button.addEventListener('click', () => submitAnswer(Number(button.dataset.choice), button));
  });
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

function resetProgress() {
  if (!confirm('Réinitialiser toute ta progression ? Les thèmes sélectionnés seront conservés.')) return;
  progress = { completed: {}, scores: {}, history: [] };
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
  saveProgress();
  currentCourse = null;
  currentLevel = 0;
  showView('homeView');
  render();
  showToast('Progression réinitialisée.');
}

function copyText(text) {
  if (!navigator.clipboard) {
    showToast('Copie non disponible.');
    return;
  }
  navigator.clipboard.writeText(text)
    .then(() => showToast('Code copié !'))
    .catch(() => showToast('Copie non disponible.'));
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }).format(new Date(value));
  } catch {
    return '';
  }
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

document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.view === 'home') { showView('homeView'); render(); }
    if (btn.dataset.view === 'progress') { showView('progressView'); renderProgressPage(); }
    if (btn.dataset.view === 'themes') openThemesView();
  });
});

$('#backBtn').addEventListener('click', () => { showView('homeView'); render(); });
$('#resetBtn').addEventListener('click', resetProgress);
$('#selectAllThemes').addEventListener('click', () => {
  document.querySelectorAll('#themeChooser input').forEach(input => input.checked = true);
});
$('#saveThemes').addEventListener('click', () => {
  const values = readThemeSelection();
  if (!values) return;
  selectedThemes = values;
  saveThemes();
  showView('homeView');
});

saveProgress();
render();
