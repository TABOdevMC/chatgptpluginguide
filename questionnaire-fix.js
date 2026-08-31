// Correctif robuste du questionnaire de première connexion.
// Il évite de rerendre la question à chaque clic et lit directement les
// choix présents dans le DOM avant de passer à l'étape suivante.
(function () {
  'use strict';

  function get(id) { return document.getElementById(id); }

  function selectedValues(question) {
    return Array.from(document.querySelectorAll('#onboardingBody input:checked'))
      .map(input => input.value);
  }

  function syncCurrentAnswers() {
    if (typeof QUESTIONS === 'undefined' || typeof onboardingStep === 'undefined') return;
    const question = QUESTIONS[onboardingStep];
    if (!question || typeof onboardingAnswers === 'undefined') return;

    if (question.type === 'single') {
      const input = document.querySelector('#onboardingBody input:checked');
      onboardingAnswers[question.key] = input ? input.value : null;
    } else {
      onboardingAnswers[question.key] = selectedValues(question);
    }
  }

  function renderFixedQuestion() {
    if (typeof QUESTIONS === 'undefined' || typeof onboardingStep === 'undefined') return;
    const question = QUESTIONS[onboardingStep];
    const selected = onboardingAnswers[question.key];
    const bar = get('onboardingBar');
    const label = get('onboardingStepLabel');
    const title = get('onboardingTitle');
    const description = get('onboardingDescription');
    const body = get('onboardingBody');
    const back = get('onboardingBack');
    const next = get('onboardingNext');

    if (!body) return;
    if (bar) bar.style.width = `${((onboardingStep + 1) / QUESTIONS.length) * 100}%`;
    if (label) label.textContent = `DIAGNOSTIC · ${onboardingStep + 1}/${QUESTIONS.length}`;
    if (title) title.textContent = question.title;
    if (description) description.textContent = question.description;

    body.innerHTML = question.options.map(([value, text]) => {
      const checked = question.type === 'single'
        ? selected === value
        : Array.isArray(selected) && selected.includes(value);

      return `<label class="assessment-option ${checked ? 'selected' : ''}">
        <input type="${question.type === 'single' ? 'radio' : 'checkbox'}"
               name="assessment"
               value="${escapeLocal(textValue(value))}"
               ${checked ? 'checked' : ''}>
        <span>${escapeLocal(text)}</span>
      </label>`;
    }).join('');

    if (back) back.disabled = onboardingStep === 0;
    if (next) next.textContent = onboardingStep === QUESTIONS.length - 1 ? 'Terminer' : 'Continuer';

    body.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        syncCurrentAnswers();
        input.closest('.assessment-option')?.classList.toggle('selected', input.checked);
      });
    });
  }

  // Valeur brute sûre pour l'attribut HTML.
  function textValue(value) {
    return String(value);
  }

  function escapeLocal(value) {
    return String(value).replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[c]));
  }

  function nextFixed() {
    syncCurrentAnswers();
    const question = QUESTIONS[onboardingStep];
    const value = onboardingAnswers[question.key];

    if (question.type === 'single' && !value) {
      showToast('Choisis une réponse avant de continuer.');
      return;
    }
    if (question.type === 'multi' && (!Array.isArray(value) || value.length === 0)) {
      showToast('Sélectionne au moins une réponse.');
      return;
    }

    if (onboardingStep < QUESTIONS.length - 1) {
      onboardingStep += 1;
      renderFixedQuestion();
      return;
    }

    profile = {
      ...onboardingAnswers,
      completedAt: new Date().toISOString()
    };

    writeCookie(PROFILE_COOKIE_NAME, profile);
    const modal = get('onboarding');
    if (modal) modal.classList.add('hidden');
    renderHome();
    renderProgress();
    renderBadges();
    showToast('Profil créé ! Tes recommandations sont activées.');
  }

  function backFixed() {
    syncCurrentAnswers();
    if (onboardingStep <= 0) return;
    onboardingStep -= 1;
    renderFixedQuestion();
  }

  function activate() {
    const next = get('onboardingNext');
    const back = get('onboardingBack');
    if (next) next.onclick = nextFixed;
    if (back) back.onclick = backFixed;

    // Remplace également la fonction globale utilisée lorsqu'on refait le diagnostic.
    window.openFixedOnboarding = function () {
      onboardingStep = 0;
      onboardingAnswers = { level: null, goals: [], knowledge: [], strengths: [], weaknesses: [] };
      const modal = get('onboarding');
      if (modal) modal.classList.remove('hidden');
      renderFixedQuestion();
    };

    const retake = get('retakeBtn');
    if (retake) retake.onclick = window.openFixedOnboarding;

    if (!profile && get('onboarding') && !get('onboarding').classList.contains('hidden')) {
      renderFixedQuestion();
    }
  }

  // Le script est chargé après app.js : le DOM et les variables du moteur existent déjà.
  activate();
})();
