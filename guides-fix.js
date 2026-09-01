(() => {
  'use strict';

  // Certaines anciennes entrées de guides-library.js n'ont pas de propriété `id`.
  // Le clic est donc résolu par le titre de la carte, ce qui rend le lecteur fiable
  // même lorsque data-id vaut "undefined".
  function unlockScroll() {
    document.documentElement.style.removeProperty('overflow');
    document.body.style.removeProperty('overflow');
    document.documentElement.style.overflowY = 'scroll';
    document.body.style.overflowY = 'scroll';
    document.body.style.position = 'static';
    document.body.style.height = 'auto';
  }

  function renderFallbackGuide(guide, index) {
    const article = document.getElementById('article');
    const reader = document.getElementById('reader');
    const library = document.getElementById('library');
    const levelEl = document.getElementById('rlevel');
    if (!article || !reader || !library || !guide) return false;

    const levelMap = {
      beginner: ['Débutant', 'beginner', '🟢'],
      intermediate: ['Intermédiaire', 'intermediate', '🔵'],
      advanced: ['Avancé', 'advanced', '🟡'],
      expert: ['Expert', 'expert', '🟣']
    };
    const level = levelMap[guide.level] || levelMap.beginner;
    const imports = Array.isArray(guide.imports) ? guide.imports : [];
    const importText = imports.length
      ? imports.join('\n')
      : '// Aucun import spécifique indiqué pour ce guide.';
    const code = guide.code || `// Exemple à adapter au sujet : ${guide.title}`;
    const esc = value => String(value).replace(/[&<>"']/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
    }[c]));

    levelEl.className = `tag ${guide.level || 'beginner'}`;
    levelEl.textContent = `${level[2]} ${level[0]}`;
    article.innerHTML = `
      <div class="eyebrow">${esc(guide.category || '')}</div>
      <h1>${esc(guide.title || 'Guide')}</h1>
      <p>${esc(guide.description || '')}</p>

      <div class="callout">
        <strong>🎯 Objectif</strong>
        <p>Savoir comprendre <strong>${esc(guide.title || '')}</strong>, choisir le bon outil et l’intégrer proprement dans un plugin Paper.</p>
      </div>

      <h2>1. Explication</h2>
      <p>Commence par identifier le rôle exact de ce concept, son cycle de vie et les objets qu’il manipule. Dans un vrai plugin, évite de concentrer toute la logique dans la classe principale : utilise des listeners, services, repositories ou composants dédiés.</p>
      <p>À chaque utilisation, demande-toi aussi ce qui se passe si le joueur est déconnecté, si une donnée manque, si un objet est nul ou si l’opération est déclenchée très souvent.</p>

      <h2>2. Imports utiles</h2>
      <div class="callout imports">
        <pre><code>${esc(importText)}</code></pre>
        <p><strong>Important :</strong> les classes comme <code>MyPlugin</code>, <code>PlayerData</code>, <code>CoinService</code>, <code>Menu</code> ou <code>QuestService</code> sont des classes personnalisées de ton projet et doivent être déclarées par toi.</p>
      </div>

      <h2>3. Exemple de code</h2>
      <pre><code>${esc(code)}</code></pre>

      <h2>4. Ce qu’il faut vérifier</h2>
      <div class="check">⚠️ La version exacte de Paper ciblée.</div>
      <div class="check">⚠️ Les cas limites et valeurs absentes.</div>
      <div class="check">⚠️ Le thread d’exécution pour les opérations lourdes.</div>
      <div class="check">⚠️ Le nettoyage des tâches, listeners et ressources.</div>

      <h2>5. Bonnes pratiques</h2>
      <ul>
        <li>Privilégie les API publiques Paper et Adventure.</li>
        <li>Garde les responsabilités séparées.</li>
        <li>Valide les entrées avant de modifier le monde ou les données.</li>
        <li>Évite les recherches globales répétées dans les systèmes fréquents.</li>
      </ul>

      <h2>6. Défi pratique</h2>
      <div class="callout">
        <strong>🧠 À toi de jouer</strong>
        <p>Construis une petite fonctionnalité autour de « ${esc(guide.title || '')} », avec une classe personnalisée dédiée et au moins deux cas limites.</p>
      </div>

      <h2>7. Pour aller plus loin</h2>
      <p>Combine ce concept avec configuration, permissions, scheduler, données et interface pour passer d’un exemple isolé à une fonctionnalité complète.</p>

      <div class="navguides">
        <button type="button" id="fallbackPrev" ${index <= 0 ? 'disabled' : ''}>← Précédent</button>
        <button type="button" id="fallbackNext" ${index >= GUIDE_LIBRARY.length - 1 ? 'disabled' : ''}>Suivant →</button>
      </div>
    `;

    library.style.display = 'none';
    reader.classList.add('open');
    reader.style.display = 'block';
    unlockScroll();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const previous = document.getElementById('fallbackPrev');
    const next = document.getElementById('fallbackNext');
    if (previous && index > 0) previous.addEventListener('click', () => renderFallbackGuide(GUIDE_LIBRARY[index - 1], index - 1));
    if (next && index < GUIDE_LIBRARY.length - 1) next.addEventListener('click', () => renderFallbackGuide(GUIDE_LIBRARY[index + 1], index + 1));
    return true;
  }

  function resolveGuideFromButton(button) {
    if (!Array.isArray(window.GUIDE_LIBRARY)) return null;
    const rawId = button.dataset.id;
    if (rawId && rawId !== 'undefined' && rawId !== 'null') {
      const byId = GUIDE_LIBRARY.find(g => String(g.id) === String(rawId));
      if (byId) return byId;
    }
    const card = button.closest('.card');
    const title = card && card.querySelector('h3')?.textContent?.trim();
    if (!title) return null;
    return GUIDE_LIBRARY.find(g => g.title === title) || null;
  }

  // Capture avant les handlers ajoutés par la page : même si l'ancien openGuide reçoit
  // "undefined", on ouvre ici le bon guide à partir du titre visible de la carte.
  document.addEventListener('click', event => {
    const button = event.target instanceof Element ? event.target.closest('button[data-id]') : null;
    if (!button) return;
    const guide = resolveGuideFromButton(button);
    if (!guide) return;
    const index = GUIDE_LIBRARY.indexOf(guide);
    event.preventDefault();
    event.stopImmediatePropagation();
    renderFallbackGuide(guide, index);
  }, true);

  const back = document.getElementById('back');
  if (back) back.addEventListener('click', event => {
    event.preventDefault();
    const reader = document.getElementById('reader');
    const library = document.getElementById('library');
    if (reader) {
      reader.classList.remove('open');
      reader.style.display = 'none';
    }
    if (library) library.style.display = 'block';
    unlockScroll();
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, true);

  window.addEventListener('load', unlockScroll);
  window.addEventListener('pageshow', unlockScroll);
})();
