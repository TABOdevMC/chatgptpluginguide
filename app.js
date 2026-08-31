const COOKIE_NAME = 'webcode_progress';
const COOKIE_DAYS = 365;
let progress = loadProgress();
let currentCourse = null;
let currentLevel = 0;

const $ = (selector) => document.querySelector(selector);

function loadProgress() {
  try {
    const cookie = document.cookie.split('; ').find(row => row.startsWith(COOKIE_NAME + '='));
    if (!cookie) return { completed: {}, scores: {}, history: [] };
    const value = decodeURIComponent(cookie.split('=').slice(1).join('='));
    const parsed = JSON.parse(value);
    return {
      completed: parsed.completed || {},
      scores: parsed.scores || {},
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 20) : []
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
  if (status) status.textContent = 'Progression sauvegardée dans un cookie';
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

function totalLevels() {
  return Object.values(COURSES).reduce((sum, course) => sum + course.levels.length, 0);
}

function totalCompleted() {
  return Object.keys(progress.completed).length;
}

function render() {
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

function renderSkills() {
  const grid = $('#skillGrid');
  grid.innerHTML = '';
  Object.values(COURSES).forEach(course => {
    const done = course.levels.filter((_, i) => isComplete(course.id, i)).length;
    const pct = done / course.levels.length * 100;
    const card = document.createElement('article');
    card.className = 'card skill-card';
    const nextIndex = course.levels.findIndex((_, i) => !isComplete(course.id, i));
    const target = nextIndex === -1 ? course.levels.length - 1 : nextIndex;
    card.innerHTML = `
      <div class="skill-icon">${course.icon}</div>
      <div class="eyebrow">${course.color}</div>
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
  ['homeView', 'progressView', 'lessonView'].forEach(viewId => {
    $('#' + viewId).classList.toggle('hidden', viewId !== id);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openLesson(courseId, levelIndex) {
  const course = COURSES[courseId];
  if (!course || !isUnlocked(courseId, levelIndex)) return;
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
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    if (i === currentLevel) btn.classList.add('current');
    if (isComplete(course.id, i)) btn.classList.add('done');
    if (!isUnlocked(course.id, i)) btn.classList.add('locked');
    btn.disabled = !isUnlocked(course.id, i);
    btn.textContent = `${isComplete(course.id, i) ? '✓ ' : isUnlocked(course.id, i) ? '' : '🔒 '}${i + 1}. ${lesson.title.replace(/^Niveau \d+ — /, '')}`;
    if (!btn.disabled) btn.addEventListener('click', () => { currentLevel = i; renderLesson(); });
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
      ${completed ? `<p class="muted">Meilleur résultat : ${score}%</p>` : ''}
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
  buttons[lesson.correct].classList.add('correct');
  if (choice === lesson.correct) {
    clickedButton.classList.add('correct');
    result.className = 'quiz-result result-ok';
    result.textContent = '✓ Bonne réponse ! Niveau validé.';
    progress.completed[key(currentCourse, currentLevel)] = { at: new Date().toISOString() };
    progress.scores[key(currentCourse, currentLevel)] = 100;
    progress.history.unshift({ course: course.name, title: lesson.title, at: new Date().toISOString() });
    progress.history = progress.history.slice(0, 20);
    saveProgress();
    renderSkills();
    renderOverallProgress();
    $('#lessonStatus').textContent = '✓ Validé';
    renderLevelList(course);
    const next = document.createElement('button');
    next.className = 'next-btn';
    next.id = 'nextBtn';
    next.textContent = currentLevel < course.levels.length - 1 ? 'Niveau suivant →' : 'Parcours terminé 🎉';
    next.addEventListener('click', nextLevel);
    $('#lessonContent .quiz').appendChild(next);
    showToast('Niveau validé !');
  } else {
    clickedButton.classList.add('wrong');
    result.className = 'quiz-result result-bad';
    result.textContent = '✗ Mauvaise réponse. Relis le cours et réessaie.';
    buttons.forEach(btn => btn.disabled = false);
    progress.scores[key(currentCourse, currentLevel)] = 0;
    saveProgress();
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
  const courses = Object.values(COURSES);
  const stats = $('#statsGrid');
  stats.innerHTML = `
    <div class="card"><div class="muted">Niveaux terminés</div><div class="stat">${completed}/${total}</div></div>
    <div class="card"><div class="muted">Progression</div><div class="stat">${Math.round(completed / total * 100)}%</div></div>
    <div class="card"><div class="muted">Compétences</div><div class="stat">${courses.filter(c => c.levels.every((_, i) => isComplete(c.id, i))).length}/${courses.length}</div></div>
    <div class="card"><div class="muted">Historique</div><div class="stat">${progress.history.length}</div></div>
  `;
  $('#history').innerHTML = progress.history.length ? progress.history.map(item => `<div class="history-row"><span>✓ ${escapeHtml(item.course)} — ${escapeHtml(item.title)}</span><span class="muted">${formatDate(item.at)}</span></div>`).join('') : '<p class="muted">Aucun niveau validé pour le moment.</p>';
}

function resetProgress() {
  if (!confirm('Réinitialiser toute ta progression ? Cette action est irréversible.')) return;
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
  navigator.clipboard?.writeText(text).then(() => showToast('Code copié !')).catch(() => showToast('Copie non disponible.'));
}

function formatDate(value) {
  try { return new Intl.DateTimeFormat('fr-FR', { day:'2-digit', month:'2-digit' }).format(new Date(value)); }
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

document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.view === 'home') { showView('homeView'); render(); }
    if (btn.dataset.view === 'progress') { showView('progressView'); renderProgressPage(); }
  });
});
$('#backBtn').addEventListener('click', () => { showView('homeView'); render(); });
$('#resetBtn').addEventListener('click', resetProgress);

saveProgress();
render();
