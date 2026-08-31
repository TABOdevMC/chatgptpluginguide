// Questionnaire de première connexion — version autonome et robuste.
// Ce fichier est chargé après app.js et remplace complètement le moteur
// d'onboarding afin d'éviter les conflits avec l'ancien questionnaire.
(function () {
  'use strict';

  const $id = (id) => document.getElementById(id);
  const STORAGE_KEY = 'paperdev_profile';

  let step = 0;
  let answers = {
    level: null,
    goals: [],
    knowledge: [],
    strengths: [],
    weaknesses: []
  };

  const QUESTIONS = [
    {
      key: 'level',
      title: 'Quel est ton niveau en Java ?',
      description: 'Cette réponse nous permet d’adapter la difficulté des premiers cours.',
      type: 'single',
      options: [
        ['beginner', 'Je débute complètement en Java'],
        ['basic', 'Je connais les variables, conditions et boucles'],
        ['intermediate', 'Je sais déjà créer de petites applications Java'],
        ['advanced', 'Je suis à l’aise avec Java et la programmation orientée objet']
      ]
    },
    {
      key: 'goals',
      title: 'Que veux-tu faire avec Paper ?',
      description: 'Sélectionne un ou plusieurs objectifs.',
      type: 'multi',
      options: [
        ['plugin', 'Créer mon premier plugin Paper'],
        ['gameplay', 'Créer des mécaniques de gameplay'],
        ['commands', 'Créer des commandes et interfaces'],
        ['data', 'Gérer des données, configurations et bases de données'],
        ['advanced', 'Créer des plugins avancés et optimisés']
      ]
    },
    {
      key: 'knowledge',
      title: 'Quelles notions connais-tu déjà ?',
      description: 'Sélectionne tout ce que tu as déjà utilisé, même sur un autre projet.',
      type: 'multi',
      options: [
        ['java', 'Java'],
        ['gradle', 'Gradle ou Maven'],
        ['plugin', 'JavaPlugin / configuration du plugin'],
        ['events', 'Events / listeners'],
        ['scheduler', 'Scheduler / tâches'],
        ['pdc', 'PersistentDataContainer'],
        ['commands', 'Commandes'],
        ['none', 'Aucune de ces notions']
      ]
    },
    {
      key: 'strengths',
      title: 'Quels sont tes points forts ?',
      description: 'Cela nous aide à construire un parcours qui ne répète pas inutilement ce que tu maîtrises.',
      type: 'multi',
      options: [
        ['logic', 'Logique / résolution de problèmes'],
        ['java', 'Java'],
        ['api', 'Comprendre une API'],
        ['debug', 'Trouver et corriger des bugs'],
        ['design', 'Design / interfaces'],
        ['organization', 'Organisation du code']
      ]
    },
    {
      key: 'weaknesses',
      title: 'Sur quoi veux-tu progresser ?',
      description: 'Ces difficultés influencent directement les recommandations ⭐.',
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

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[c]));
  }

  function readCookie(name) {
    const row = document.cookie
      .split('; ')
      .find((entry) => entry.startsWith(name + '='));
    if (!row) return null;
    try {
      return JSON.parse(decodeURIComponent(row.slice(name.length + 1)));
    } catch {
      return null;
    }
  }

  function writeProfile(profile) {
    const encoded = encodeURIComponent(JSON.stringify(profile));
    document.cookie = `${STORAGE_KEY}=${encoded}; Max-Age=${365 * 86400}; Path=/; SameSite=Lax`;
  }

  function showMessage(message) {
    if (typeof window.showToast === 'function') {
      window.showToast(message);
      return;
    }
    const toast = $id('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function selectedFor(question) {
    return answers[question.key];
  }

  function render() {
    const question = QUESTIONS[step];
    if (!question) return;

    const bar = $id('onboardingBar');
    const label = $id('onboardingStepLabel');
    const title = $id('onboardingTitle');
    const description = $id('onboardingDescription');
    const body = $id('onboardingBody');
    const back = $id('onboardingBack');
    const next = $id('onboardingNext');

    if (!body) return;

    const selected = selectedFor(question);
    const selectedArray = Array.isArray(selected) ? selected : [];

    if (bar) bar.style.width = `${((step + 1) / QUESTIONS.length) * 100}%`;
    if (label) label.textContent = `DIAGNOSTIC · ${step + 1}/${QUESTIONS.length}`;
    if (title) title.textContent = question.title;
    if (description) description.textContent = question.description;
    if (back) back.disabled = step === 0;
    if (next) next.textContent = step === QUESTIONS.length - 1 ? 'Terminer' : 'Continuer';

    body.innerHTML = question.options.map(([value, text]) => {
      const checked = question.type === 'single'
        ? selected === value
        : selectedArray.includes(value);

      return `
        <button
          type="button"
          class="assessment-choice ${checked ? 'selected' : ''}"
          data-value="${escapeHtml(value)}"
          aria-pressed="${checked}"
        >
          <span class="assessment-choice-check">${checked ? '✓' : ''}</span>
          <span>${escapeHtml(text)}</span>
        </button>
      `;
    }).join('');

    body.querySelectorAll('.assessment-choice').forEach((button) => {
      button.addEventListener('click', () => {
        const value = button.dataset.value;

        if (question.type === 'single') {
          answers[question.key] = value;
          render();
          return;
        }

        const current = Array.isArray(answers[question.key])
          ? [...answers[question.key]]
          : [];

        // "Aucune" annule les autres choix.
        if (value === 'none') {
          answers[question.key] = current.includes('none') ? [] : ['none'];
        } else {
          const withoutNone = current.filter((item) => item !== 'none');
          if (withoutNone.includes(value)) {
            answers[question.key] = withoutNone.filter((item) => item !== value);
          } else {
            answers[question.key] = [...withoutNone, value];
          }
        }

        render();
      });
    });
  }

  function validCurrentAnswer() {
    const question = QUESTIONS[step];
    const value = answers[question.key];

    if (question.type === 'single') {
      return typeof value === 'string' && value.length > 0;
    }

    return Array.isArray(value) && value.length > 0;
  }

  function finish() {
    const profile = {
      ...answers,
      completedAt: new Date().toISOString(),
      version: 2
    };

    writeProfile(profile);

    // Synchronise aussi les variables du moteur principal lorsqu'elles existent.
    try {
      window.profile = profile;
    } catch {}

    const modal = $id('onboarding');
    if (modal) modal.classList.add('hidden');

    if (typeof window.renderHome === 'function') window.renderHome();
    if (typeof window.renderProgress === 'function') window.renderProgress();
    if (typeof window.render === 'function') window.render();

    showMessage('Profil terminé ! Tes recommandations ⭐ sont maintenant activées.');
  }

  function next() {
    if (!validCurrentAnswer()) {
      showMessage('Choisis au moins une réponse pour continuer.');
      return;
    }

    if (step < QUESTIONS.length - 1) {
      step += 1;
      render();
      return;
    }

    finish();
  }

  function back() {
    if (step === 0) return;
    step -= 1;
    render();
  }

  function open() {
    step = 0;
    answers = {
      level: null,
      goals: [],
      knowledge: [],
      strengths: [],
      weaknesses: []
    };

    const modal = $id('onboarding');
    if (modal) modal.classList.remove('hidden');
    render();
  }

  function init() {
    const nextButton = $id('onboardingNext');
    const backButton = $id('onboardingBack');
    const retakeButton = $id('retakeBtn');

    // Remplace complètement les handlers du moteur précédent.
    if (nextButton) nextButton.onclick = next;
    if (backButton) backButton.onclick = back;
    if (retakeButton) retakeButton.onclick = open;

    window.openOnboarding = open;
    window.paperDevOpenQuestionnaire = open;

    const existingProfile = readCookie(STORAGE_KEY);
    if (!existingProfile) {
      open();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
