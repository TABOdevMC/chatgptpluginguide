(() => {
  'use strict';

  const safeEscape = (value) => {
    try { return typeof escapeHtml === 'function' ? escapeHtml(value ?? '') : String(value ?? ''); }
    catch { return String(value ?? ''); }
  };

  function getCurrent() {
    try {
      if (typeof currentCourse === 'undefined' || typeof currentLevel === 'undefined') return null;
      const course = COURSES?.[currentCourse];
      const lesson = course?.levels?.[currentLevel];
      return course && lesson ? { course, lesson } : null;
    } catch { return null; }
  }

  function renderSafeLevelList(course) {
    const list = document.querySelector('#levelList');
    if (!list || !course?.levels) return;
    list.innerHTML = '';
    course.levels.forEach((lesson, i) => {
      if (!lesson || typeof lesson !== 'object') return;
      const title = String(lesson.title || `Niveau ${i + 1}`);
      const unlocked = i === 0 || (() => { try { return isComplete(course.id, i - 1); } catch { return false; } })();
      const done = (() => { try { return isComplete(course.id, i); } catch { return false; } })();
      const btn = document.createElement('button');
      btn.className = `level-btn${i === currentLevel ? ' current' : ''}${done ? ' done' : ''}${!unlocked ? ' locked' : ''}`;
      btn.disabled = !unlocked;
      btn.textContent = `${done ? '✓ ' : unlocked ? '' : '🔒 '}${i + 1}. ${title.replace(/^Niveau \d+ — /, '')}`;
      if (unlocked) btn.addEventListener('click', () => {
        currentLevel = i;
        try { renderLesson(); } catch { renderSafeLesson(); }
      });
      list.appendChild(btn);
    });
  }

  function renderSafeLesson() {
    const current = getCurrent();
    if (!current) return;
    const { course, lesson } = current;
    const skill = document.querySelector('#lessonSkill');
    const title = document.querySelector('#lessonTitle');
    const status = document.querySelector('#lessonStatus');
    const content = document.querySelector('#lessonContent');
    if (!content) return;

    if (skill) skill.textContent = `${course.icon || '📘'} ${course.name || course.id} · Niveau ${Number(currentLevel) + 1}/${course.levels.length}`;
    if (title) title.textContent = String(lesson.title || `Niveau ${Number(currentLevel) + 1}`);
    const complete = (() => { try { return isComplete(course.id, currentLevel); } catch { return false; } })();
    if (status) status.textContent = complete ? '✓ Validé' : 'À apprendre';

    const rawAnswers = Array.isArray(lesson.a) ? lesson.a : [];
    const answerEntries = rawAnswers.map((text, originalIndex) => ({ text: String(text ?? ''), originalIndex }));
    for (let i = answerEntries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answerEntries[i], answerEntries[j]] = [answerEntries[j], answerEntries[i]];
    }
    const answers = answerEntries.map(({text, originalIndex}) => `<button class="answer" data-choice="${originalIndex}">${safeEscape(text)}</button>`).join('');
    const score = (() => { try { return progress.scores?.[`${course.id}:${currentLevel}`] ?? 0; } catch { return 0; } })();
    const code = String(lesson.code ?? '');
    const tip = String(lesson.tip ?? '');
    const question = String(lesson.q ?? '');

    content.innerHTML = `<div class="eyebrow">Cours</div><h2>${safeEscape(lesson.title || '')}</h2><p>${safeEscape(lesson.text || 'Contenu indisponible pour ce niveau.')}</p><div class="code-wrap"><button class="copy-btn" id="copyCode">Copier</button><pre><code>${safeEscape(code)}</code></pre></div><div class="tip"><strong>💡 À retenir</strong><br>${safeEscape(tip)}</div><section class="quiz"><div class="eyebrow">Test de validation</div><h3>${safeEscape(question)}</h3><div class="answer-grid">${answers}</div><div id="quizResult" class="quiz-result"></div>${complete ? `<button class="next-btn" id="nextBtn">${Number(currentLevel) < course.levels.length - 1 ? 'Niveau suivant →' : 'Parcours terminé 🎉'}</button><p class="muted">Résultat : ${score}%</p>` : ''}</section>`;

    renderSafeLevelList(course);
    const copy = document.querySelector('#copyCode');
    if (copy && typeof copyText === 'function') copy.addEventListener('click', () => copyText(code));
    content.querySelectorAll('.answer').forEach(button => button.addEventListener('click', () => {
      try { submitAnswer(Number(button.dataset.choice), button); } catch (error) { console.error('Erreur quiz:', error); }
    }));
    const next = document.querySelector('#nextBtn');
    if (next && typeof nextLevel === 'function') next.addEventListener('click', nextLevel);
  }

  function repair() {
    const view = document.querySelector('#lessonView');
    if (!view || view.classList.contains('hidden')) return;
    const current = getCurrent();
    if (!current) return;
    const list = document.querySelector('#levelList');
    const content = document.querySelector('#lessonContent');
    const listEmpty = list && !list.querySelector('.level-btn');
    const contentEmpty = content && !content.querySelector('.quiz');
    if (listEmpty || contentEmpty) renderSafeLesson();
  }

  window.addEventListener('DOMContentLoaded', repair);
  window.addEventListener('paperprogresschange', repair);
  setInterval(repair, 400);
})();
