const COOKIE_NAME = 'paperdev_progress';
const THEME_COOKIE_NAME = 'paperdev_themes';
const PROFILE_COOKIE_NAME = 'paperdev_profile';
const COOKIE_DAYS = 365;
const COOKIE_CHUNK_SIZE = 3000;
let progress = loadProgress();
let selectedThemes = loadThemes();
let profile = loadProfile();
let currentCourse = null;
let currentLevel = 0;
let onboardingStep = 0;
let onboardingAnswers = { level: null, goals: [], knowledge: [], strengths: [], weaknesses: [] };

const $ = (selector) => document.querySelector(selector);

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

function cookieChunks(name) {
  const first = cookieValue(name);
  if (first !== null) return first;
  const countRaw = cookieValue(`${name}_chunks`);
  const count = Number.parseInt(countRaw || '0', 10);
  if (!Number.isInteger(count) || count <= 0) return null;
  let result = '';
  for (let i = 0; i < count; i++) {
    const part = cookieValue(`${name}_${i}`);
    if (part === null) return null;
    result += part;
  }
  return result;
}

function writeCookieChunks(name, value) {
  const maxAge = COOKIE_DAYS * 24 * 60 * 60;
  const chunks = [];
  for (let i = 0; i < value.length; i += COOKIE_CHUNK_SIZE) {
    chunks.push(value.slice(i, i + COOKIE_CHUNK_SIZE));
  }
  deleteCookie(name);
  const oldCount = Number.parseInt(cookieValue(`${name}_chunks`) || '0', 10);
  for (let i = 0; i < oldCount; i++) deleteCookie(`${name}_${i}`);
  if (chunks.length <= 1) {
    writeCookie(name, value);
    deleteCookie(`${name}_chunks`);
    return;
  }
  deleteCookie(name);
  chunks.forEach((chunk, index) => {
    document.cookie = `${name}_${index}=${encodeURIComponent(chunk)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  });
  document.cookie = `${name}_chunks=${chunks.length}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
}

function deleteCookieChunks(name) {
  deleteCookie(name);
  const count = Number.parseInt(cookieValue(`${name}_chunks`) || '0', 10);
  for (let i = 0; i < count; i++) deleteCookie(`${name}_${i}`);
  deleteCookie(`${name}_chunks`);
}

function loadProgress() {
  try {
    const value = cookieChunks(COOKIE_NAME);
    if (!value) return { completed: {}, scores: {}, history: [] };
    const parsed = JSON.parse(value);
    return {
      completed: parsed.completed && typeof parsed.completed === 'object' ? parsed.completed : {},
      scores: parsed.scores && typeof parsed.scores === 'object' ? parsed.scores : {},
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 30) : []
    };
  } catch {
    return { completed: {}, scores: {}, history: [] };
  }
}

function saveProgress() {
  const payload = JSON.stringify(progress);
  writeCookieChunks(COOKIE_NAME, payload);
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
  if (goals.some(item => text.includes(item))) score += 2;
  if (knowledge.some(item => text.includes(item))) score += 2;
  if (strengths.some(item => text.includes(item))) score += 1;
  return score;
}

function isRecommended(courseId) {
  const course = COURSES[courseId];
  if (!profile || !course) return false;
  const ranked = visibleCourses().map(c => ({ id: c.id, score: courseScore(c) })).sort((a, b) => b.score - a.score);
  const max = ranked[0]?.score || 0;
  return courseScore(course) === max && max > 0;
}

function firstAvailableLevel(courseId) {
  const course = COURSES[courseId];
  if (!course) return 0;
  const index = course.levels.findIndex((_, i) => !isComplete(courseId, i));
  return index < 0 ? course.levels.length - 1 : index;
}

function renderThemePanel() {
  const root = $('#themePanel');
  if (!root) return;
  root.innerHTML = `<div><span class="eyebrow">THÈMES ACTIFS</span><strong>${selectedThemes.length} parcours sélectionné${selectedThemes.length > 1 ? 's' : ''}</strong><p class="muted">Change-les depuis l’onglet Thèmes sans perdre ta progression.</p></div><button class="nav-btn" data-view="themes">Gérer les thèmes</button>`;
  const button = root.querySelector('[data-view="themes"]');
  if (button) button.addEventListener('click', () => { showView('themesView'); renderThemeChooser(); });
}

function renderThemeChooser() {
  const root = $('#themeChooser');
  if (!root) return;
  root.innerHTML = Object.values(COURSES).map(course => `<label class="theme-option"><input type="checkbox" value="${course.id}" ${selectedThemes.includes(course.id) ? 'checked' : ''}><span>${course.icon} <strong>${escapeHtml(course.name)}</strong><small>${escapeHtml(course.description)}</small></span></label>`).join('');
}

function readThemeSelection() {
  const values = [...document.querySelectorAll('#themeChooser input:checked')].map(input => input.value);
  if (!values.length) { showToast('Sélectionne au moins un thème.'); return null; }
  return values;
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
    card.innerHTML = `<div class="skill-icon">${course.icon}</div>${recommended ? '<span class="recommend-star" title="Cours recommandé pour ton profil">⭐</span>' : ''}<div class="eyebrow">${escapeHtml(course.color)}</div><h3>${escapeHtml(course.name)}</h3><p>${escapeHtml(course.description)}</p><div class="skill-meta"><span>${done}/${course.levels.length} niveaux</span><span>${Math.round(pct)}%</span></div><div class="progress"><i style="width:${pct}%"></i></div><button class="primary" data-open="${course.id}" data-level="${target}">${done === course.levels.length ? 'Revoir le parcours' : done === 0 ? 'Commencer' : 'Continuer'}</button>`;
    grid.appendChild(card);
  });
  grid.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => openLesson(btn.dataset.open, Number(btn.dataset.level))));
}

function showView(id) {
  ['homeView','themesView','progressView','profileView','lessonView'].forEach(viewId => { const view = $('#' + viewId); if (view) view.classList.toggle('hidden', viewId !== id); });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openLesson(courseId, levelIndex) {
  const course = COURSES[courseId];
  if (!course || !selectedThemes.includes(courseId) || !isUnlocked(courseId, levelIndex)) return;
  currentCourse = courseId; currentLevel = levelIndex; showView('lessonView'); renderLesson();
}

function renderLesson() {
  const course = COURSES[currentCourse];
  const lesson = course.levels[currentLevel];
  $('#lessonSkill').textContent = `${course.icon} ${course.name} · Niveau ${currentLevel + 1}/${course.levels.length}`;
  $('#lessonTitle').textContent = lesson.title;
  $('#lessonStatus').textContent = isComplete(currentCourse, currentLevel) ? '✓ Validé' : 'À apprendre';
  renderLevelList(course); renderLessonContent(course, lesson);
}

function shuffleAnswers(answers) {
  return answers.map((text, index) => ({ text, originalIndex: index, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ text, originalIndex }) => ({ text, originalIndex }));
}

function renderLessonContent(course, lesson) {
  const completed = isComplete(course.id, currentLevel);
  const answers = shuffleAnswers(lesson.a);
  const answerHtml = answers.map(({ text, originalIndex }) => `<button class="answer" data-choice="${originalIndex}">${escapeHtml(text)}</button>`).join('');
  const score = progress.scores[key(course.id, currentLevel)] ?? 0;
  $('#lessonContent').innerHTML = `<div class="eyebrow">Cours</div><h2>${escapeHtml(lesson.title)}</h2><p>${escapeHtml(lesson.text)}</p><div class="code-wrap"><button class="copy-btn" id="copyCode">Copier</button><pre><code>${escapeHtml(lesson.code)}</code></pre></div><div class="tip"><strong>💡 À retenir</strong><br>${escapeHtml(lesson.tip)}</div><section class="quiz"><div class="eyebrow">Test de validation</div><h3>${escapeHtml(lesson.q)}</h3><div class="answer-grid">${answerHtml}</div><div id="quizResult" class="quiz-result"></div>${completed ? `<button class="next-btn" id="nextBtn">${currentLevel < course.levels.length - 1 ? 'Niveau suivant →' : 'Parcours terminé 🎉'}</button><p class="muted">Résultat : ${score}%</p>` : ''}</section>`;
  $('#copyCode').addEventListener('click', () => copyText(lesson.code));
  $('#lessonContent').querySelectorAll('.answer').forEach(button => button.addEventListener('click', () => submitAnswer(Number(button.dataset.choice), button)));
  if (completed) $('#nextBtn').addEventListener('click', nextLevel);
}

function submitAnswer(choice, clickedButton) {
  const course = COURSES[currentCourse], lesson = course.levels[currentLevel];
  const buttons = [...$('#lessonContent').querySelectorAll('.answer')], result = $('#quizResult');
  buttons.forEach(btn => btn.disabled = true);
  if (choice === lesson.correct) {
    const correctButton = buttons.find(btn => Number(btn.dataset.choice) === lesson.correct) || clickedButton;
    correctButton.classList.add('correct'); result.className = 'quiz-result result-ok'; result.textContent = '✓ Bonne réponse ! Niveau validé.';
    const lessonKey = key(currentCourse, currentLevel), wasAlreadyDone = isComplete(currentCourse, currentLevel);
    progress.completed[lessonKey] = { at: new Date().toISOString() }; progress.scores[lessonKey] = 100;
    if (!wasAlreadyDone) { progress.history.unshift({ course: course.name, title: lesson.title, at: new Date().toISOString() }); progress.history = progress.history.slice(0, 30); }
    saveProgress(); renderSkills(); renderRecommendations(); renderOverallProgress(); $('#lessonStatus').textContent = '✓ Validé'; renderLevelList(course);
    if (!$('#nextBtn')) { const next = document.createElement('button'); next.className = 'next-btn'; next.id = 'nextBtn'; next.textContent = currentLevel < course.levels.length - 1 ? 'Niveau suivant →' : 'Parcours terminé 🎉'; next.addEventListener('click', nextLevel); $('#lessonContent .quiz').appendChild(next); }
    showToast('Niveau validé !');
  } else {
    clickedButton.classList.add('wrong'); result.className = 'quiz-result result-bad'; result.textContent = '✗ Mauvaise réponse. Relis le cours et réessaie.'; buttons.forEach(btn => btn.disabled = false);
  }
}

function nextLevel() {
  const course = COURSES[currentCourse];
  if (currentLevel < course.levels.length - 1) { currentLevel++; renderLesson(); }
  else { showToast('Bravo, parcours terminé !'); showView('progressView'); renderProgressPage(); }
}

function renderProgressPage() {
  const completed = totalCompleted(), total = totalLevels(), allCourses = Object.values(COURSES);
  const finishedCourses = allCourses.filter(course => course.levels.every((_, i) => isComplete(course.id, i))).length;
  $('#statsGrid').innerHTML = `<div class="card"><div class="muted">Niveaux terminés</div><div class="stat">${completed}/${total}</div></div><div class="card"><div class="muted">Progression</div><div class="stat">${total ? Math.round(completed / total * 100) : 0}%</div></div><div class="card"><div class="muted">Parcours terminés</div><div class="stat">${finishedCourses}/${allCourses.length}</div></div><div class="card"><div class="muted">Thèmes actifs</div><div class="stat">${selectedThemes.length}</div></div>`;
  $('#history').innerHTML = progress.history.length ? progress.history.map(item => `<div class="history-row"><span>✓ ${escapeHtml(item.course)} — ${escapeHtml(item.title)}</span><span class="muted">${formatDate(item.at)}</span></div>`).join('') : '<p class="muted">Aucun niveau validé pour le moment.</p>';
}

function renderProfilePage() {
  const root = $('#profileContent'); if (!root) return;
  if (!profile) { root.innerHTML = '<div class="card"><h2>Profil indisponible</h2><p class="muted">Fais le questionnaire pour obtenir des recommandations personnalisées.</p></div>'; return; }
  const labels = { level:{beginner:'Débutant',basic:'Bases',intermediate:'Intermédiaire',advanced:'Avancé'}, goals:{plugin:'Premier plugin',gameplay:'Gameplay',commands:'Commandes & interfaces',data:'Données',advanced:'Plugins avancés'}, knowledge:{java:'Java',gradle:'Gradle / Maven',plugin:'Plugin Paper',events:'Events',scheduler:'Scheduler',pdc:'PDC',commands:'Commandes'}, strengths:{logic:'Logique',java:'Java',api:'APIs',debug:'Debug',design:'Design',organization:'Organisation'}, weaknesses:{java:'Java',architecture:'Architecture',events:'Events',async:'Scheduler / async',data:'Données',api:'APIs Paper',ui:'UI',commands:'Commandes',performance:'Performances'} };
  const tags = (items, group) => (items || []).map(item => `<span class="profile-tag">${escapeHtml(labels[group]?.[item] || item)}</span>`).join('');
  root.innerHTML = `<div class="profile-grid"><div class="card"><div class="eyebrow">NIVEAU ESTIMÉ</div><h2>${labels.level[profile.level] || '—'}</h2></div><div class="card"><div class="eyebrow">OBJECTIFS</div><div class="tag-list">${tags(profile.goals,'goals') || '<span class="muted">Non renseigné</span>'}</div></div><div class="card"><div class="eyebrow">CONNAISSANCES</div><div class="tag-list">${tags(profile.knowledge,'knowledge') || '<span class="muted">Aucune</span>'}</div></div><div class="card"><div class="eyebrow">POINTS FORTS</div><div class="tag-list">${tags(profile.strengths,'strengths') || '<span class="muted">Non renseigné</span>'}</div></div><div class="card"><div class="eyebrow">À TRAVAILLER</div><div class="tag-list">${tags(profile.weaknesses,'weaknesses') || '<span class="muted">Non renseigné</span>'}</div></div></div>`;
}

function resetProgress() {
  if (!confirm('Réinitialiser toute ta progression ? Le profil et les thèmes seront conservés.')) return;
  progress = { completed:{}, scores:{}, history:[] }; deleteCookieChunks(COOKIE_NAME); saveProgress(); currentCourse = null; currentLevel = 0; showView('homeView'); render(); showToast('Progression réinitialisée.');
}

function copyText(text) { if (!navigator.clipboard) return showToast('Copie non disponible.'); navigator.clipboard.writeText(text).then(() => showToast('Code copié !')).catch(() => showToast('Copie non disponible.')); }
function formatDate(value) { try { return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value)); } catch { return ''; } }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'),2200); }
function escapeHtml(value) { return String(value).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c])); }

function openOnboarding() { onboardingStep=0; onboardingAnswers={level:null,goals:[],knowledge:[],strengths:[],weaknesses:[]}; $('#onboarding').classList.remove('hidden'); renderOnboardingStep(); }
function renderOnboardingStep() {
  const step=ASSESSMENT_STEPS[onboardingStep], progressPct=(onboardingStep+1)/ASSESSMENT_STEPS.length*100;
  $('#onboardingBar').style.width=`${progressPct}%`; $('#onboardingStepLabel').textContent=`DIAGNOSTIC · ${onboardingStep+1}/${ASSESSMENT_STEPS.length}`; $('#onboardingTitle').textContent=step.title; $('#onboardingDescription').textContent=step.description;
  const selected=onboardingAnswers[step.key];
  $('#onboardingBody').innerHTML=step.options.map(([value,label])=>{const active=step.type==='single'?selected===value:selected.includes(value);return `<label class="assessment-option ${active?'selected':''}"><input type="${step.type==='single'?'radio':'checkbox'}" name="assessment" value="${value}" ${active?'checked':''}><span>${escapeHtml(label)}</span></label>`;}).join('');
  $('#onboardingBack').disabled=onboardingStep===0; $('#onboardingNext').textContent=onboardingStep===ASSESSMENT_STEPS.length-1?'Terminer':'Continuer'; $('#onboardingBody').querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>collectOnboardingStep(step)));
}
function collectOnboardingStep(step) { if(step.type==='single'){const input=$('#onboardingBody input:checked');onboardingAnswers[step.key]=input?input.value:null;}else onboardingAnswers[step.key]=[...$('#onboardingBody input:checked')].map(input=>input.value);renderOnboardingStep(); }
function goOnboardingNext(){const step=ASSESSMENT_STEPS[onboardingStep];if(step.type==='single'&&!onboardingAnswers[step.key]){showToast('Choisis une réponse avant de continuer.');return;}if(step.type==='multi'&&!onboardingAnswers[step.key]?.length){showToast('Sélectionne au moins une réponse.');return;}if(onboardingStep<ASSESSMENT_STEPS.length-1){onboardingStep++;renderOnboardingStep();return;}profile={...onboardingAnswers,completedAt:new Date().toISOString()};saveProfile();$('#onboarding').classList.add('hidden');render();showToast('Profil créé ! Tes recommandations sont prêtes.');}
function goOnboardingBack(){if(onboardingStep===0)return;onboardingStep--;renderOnboardingStep();}
function startAssessmentAgain(){openOnboarding();}

$('#onboardingNext').addEventListener('click',goOnboardingNext);$('#onboardingBack').addEventListener('click',goOnboardingBack);$('#retakeBtn').addEventListener('click',startAssessmentAgain);
$('#saveThemes').addEventListener('click',()=>{const values=readThemeSelection();if(!values)return;selectedThemes=values;saveThemes();showView('homeView');render();showToast('Thèmes mis à jour.');});
$('#selectAllThemes').addEventListener('click',()=>document.querySelectorAll('#themeChooser input').forEach(input=>input.checked=true));
document.querySelectorAll('.nav-btn[data-view]').forEach(btn=>btn.addEventListener('click',()=>{showView(btn.dataset.view==='home'?'homeView':btn.dataset.view==='progress'?'progressView':btn.dataset.view==='themes'?'themesView':'profileView');if(btn.dataset.view==='themes')renderThemeChooser();if(btn.dataset.view==='progress')renderProgressPage();if(btn.dataset.view==='profile')renderProfilePage();}));
$('#resetBtn').addEventListener('click',resetProgress);$('#backBtn').addEventListener('click',()=>{showView('homeView');render();});

render();
if (!profile) openOnboarding();