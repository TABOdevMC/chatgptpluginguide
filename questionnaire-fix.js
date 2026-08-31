// Questionnaire de première connexion — moteur autonome.
// Ce fichier ne dépend pas de l'état interne de app.js.
(function () {
  'use strict';

  const PROFILE_COOKIE = 'paperdev_profile';
  const COOKIE_DAYS = 365;
  const $ = (id) => document.getElementById(id);

  const QUESTIONS = [
    {
      key: 'level',
      title: 'Quel est ton niveau en Java ?',
      description: 'Choisis la réponse qui correspond le mieux à ton niveau actuel.',
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
      title: 'Que veux-tu apprendre avec Paper ?',
      description: 'Sélectionne un ou plusieurs objectifs.',
      type: 'multi',
      options: [
        ['plugin', 'Créer mon premier plugin Paper'],
        ['gameplay', 'Créer des mécaniques de gameplay'],
        ['commands', 'Créer des commandes et interfaces'],
        ['data', 'Gérer les données, configurations et bases de données'],
        ['advanced', 'Créer des plugins avancés et optimisés']
      ]
    },
    {
      key: 'knowledge',
      title: 'Quelles notions connais-tu déjà ?',
      description: 'Sélectionne tout ce que tu as déjà utilisé.',
      type: 'multi',
      options: [
        ['java', 'Java'],
        ['gradle', 'Gradle ou Maven'],
        ['plugin', 'JavaPlugin et configuration du plugin'],
        ['events', 'Events et listeners'],
        ['scheduler', 'Scheduler et tâches'],
        ['pdc', 'PersistentDataContainer'],
        ['commands', 'Commandes'],
        ['none', 'Aucune de ces notions']
      ]
    },
    {
      key: 'strengths',
      title: 'Quels sont tes points forts ?',
      description: 'Cela aide à éviter de te faire perdre du temps sur des notions déjà maîtrisées.',
      type: 'multi',
      options: [
        ['logic', 'Logique et résolution de problèmes'],
        ['java', 'Java'],
        ['api', 'Comprendre une API'],
        ['debug', 'Trouver et corriger des bugs'],
        ['design', 'Interfaces et design'],
        ['organization', 'Organisation du code']
      ]
    },
    {
      key: 'weaknesses',
      title: 'Sur quoi veux-tu progresser ?',
      description: 'Ces difficultés servent à calculer les recommandations ⭐.',
      type: 'multi',
      options: [
        ['java', 'Bases Java'],
        ['architecture', 'Architecture et organisation'],
        ['events', 'Events'],
        ['async', 'Scheduler et asynchrone'],
        ['data', 'Sauvegarde et données'],
        ['api', 'Comprendre les APIs Paper'],
        ['ui', 'Menus, UI et messages'],
        ['commands', 'Commandes et Brigadier'],
        ['performance', 'Performances']
      ]
    }
  ];

  let currentStep = 0;
  let answers = emptyAnswers();

  function emptyAnswers() {
    return { level: null, goals: [], knowledge: [], strengths: [], weaknesses: [] };
  }

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
    const row = document.cookie.split('; ').find((item) => item.startsWith(name + '='));
    if (!row) return null;
    try {
      return JSON.parse(decodeURIComponent(row.slice(name.length + 1)));
    } catch {
      return null;
    }
  }

  function notify(message) {
    const toast = $('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function render() {
    const question = QUESTIONS[currentStep];
    const body = $('onboardingBody');
    if (!question || !body) return;

    $('onboardingBar').style.width = `${((currentStep + 1) / QUESTIONS.length) * 100}%`;
    $('onboardingStepLabel').textContent = `DIAGNOSTIC · ${currentStep + 1}/${QUESTIONS.length}`;
    $('onboardingTitle').textContent = question.title;
    $('onboardingDescription').textContent = question.description;
    $('onboardingBack').disabled = currentStep === 0;
    $('onboardingNext').textContent = currentStep === QUESTIONS.length - 1 ? 'Terminer' : 'Continuer';

    const selected = answers[question.key];
    const selectedList = Array.isArray(selected) ? selected : [];

    body.innerHTML = question.options.map(([value, label]) => {
      const active = question.type === 'single'
        ? selected === value
        : selectedList.includes(value);

      return `<button type="button" class="assessment-choice ${active ? 'selected' : ''}" data-value="${escapeHtml(value)}" aria-pressed="${active}">
        <span class="assessment-choice-check">${active ? '✓' : ''}</span>
        <span>${escapeHtml(label)}</span>
      </button>`;
    }).join('');

    body.querySelectorAll('.assessment-choice').forEach((button) => {
      button.addEventListener('click', () => select(button.dataset.value));
    });
  }

  function select(value) {
    const question = QUESTIONS[currentStep];

    if (question.type === 'single') {
      answers[question.key] = value;
      render();
      return;
    }

    const selected = Array.isArray(answers[question.key])
      ? [...answers[question.key]]
      : [];

    if (value === 'none') {
      answers[question.key] = selected.includes('none') ? [] : ['none'];
    } else {
      const filtered = selected.filter((item) => item !== 'none');
      answers[question.key] = filtered.includes(value)
        ? filtered.filter((item) => item !== value)
        : [...filtered, value];
    }

    render();
  }

  function canContinue() {
    const question = QUESTIONS[currentStep];
    const value = answers[question.key];
    return question.type === 'single'
      ? typeof value === 'string' && value.length > 0
      : Array.isArray(value) && value.length > 0;
  }

  function next() {
    if (!canContinue()) {
      notify('Choisis au moins une réponse avant de continuer.');
      return;
    }

    if (currentStep < QUESTIONS.length - 1) {
      currentStep += 1;
      render();
      return;
    }

    const profile = {
      ...answers,
      completedAt: new Date().toISOString(),
      version: 3
    };

    document.cookie = `${PROFILE_COOKIE}=${encodeURIComponent(JSON.stringify(profile))}; Max-Age=${COOKIE_DAYS * 86400}; Path=/; SameSite=Lax`;
    $('onboarding').classList.add('hidden');
    notify('Diagnostic terminé ! Tes recommandations ⭐ sont activées.');

    // Recharge app.js afin qu'il relise le profil depuis le cookie.
    setTimeout(() => window.location.reload(), 150);
  }

  function back() {
    if (currentStep === 0) return;
    currentStep -= 1;
    render();
  }

  function open() {
    currentStep = 0;
    answers = emptyAnswers();
    $('onboarding').classList.remove('hidden');
    render();
  }

  function init() {
    const nextButton = $('onboardingNext');
    const backButton = $('onboardingBack');
    const retakeButton = $('retakeBtn');

    if (!nextButton || !backButton) return;

    nextButton.onclick = next;
    backButton.onclick = back;
    if (retakeButton) retakeButton.onclick = open;
    window.paperDevOpenQuestionnaire = open;

    // Première visite uniquement : aucun profil = questionnaire.
    if (!readCookie(PROFILE_COOKIE)) {
      open();
    } else {
      $('onboarding').classList.add('hidden');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
