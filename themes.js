const THEMES_COOKIE = 'webcode_themes';
const THEMES = {
  foundations: { label: '🧱 Fondations', description: 'Structure et bases du web', courses: ['html'] },
  design: { label: '🎨 Design', description: 'Apparence et mise en page', courses: ['css'] },
  interaction: { label: '⚡ Interactivité', description: 'Logique et comportements', courses: ['js'] }
};

function readThemeCookie() {
  try {
    const raw = document.cookie.split('; ').find(row => row.startsWith(THEMES_COOKIE + '='));
    if (!raw) return Object.keys(THEMES);
    const value = decodeURIComponent(raw.split('=').slice(1).join('='));
    const parsed = JSON.parse(value);
    const valid = Array.isArray(parsed) ? parsed.filter(id => THEMES[id]) : [];
    return valid.length ? valid : Object.keys(THEMES);
  } catch {
    return Object.keys(THEMES);
  }
}

let selectedThemes = readThemeCookie();

function saveThemes() {
  const value = encodeURIComponent(JSON.stringify(selectedThemes));
  document.cookie = `${THEMES_COOKIE}=${value}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax`;
}

function courseMatchesTheme(courseId) {
  return selectedThemes.some(themeId => THEMES[themeId].courses.includes(courseId));
}

function applyThemeFilter() {
  document.querySelectorAll('#skillGrid .skill-card').forEach(card => {
    const button = card.querySelector('[data-open]');
    card.hidden = !(button && courseMatchesTheme(button.dataset.open));
  });

  const count = document.querySelectorAll('#skillGrid .skill-card:not([hidden])').length;
  const helper = document.getElementById('themeHelper');
  if (helper) {
    helper.textContent = count === 0
      ? 'Sélectionne au moins un thème.'
      : `${count} parcours affiché${count > 1 ? 's' : ''} · ta progression reste intacte.`;
  }
}

function renderThemePanel() {
  const panel = document.getElementById('themePanel');
  if (!panel) return;

  panel.innerHTML = `
    <div class="theme-panel-head">
      <div>
        <span class="eyebrow">PERSONNALISATION</span>
        <h2>Choisis tes thèmes</h2>
        <p class="muted">Tu peux en sélectionner un, deux ou tous. Tu peux les changer quand tu veux.</p>
      </div>
      <button id="themeAllBtn" class="nav-btn" type="button">Tout sélectionner</button>
    </div>
    <div class="theme-grid">
      ${Object.entries(THEMES).map(([id, theme]) => `
        <label class="theme-option ${selectedThemes.includes(id) ? 'selected' : ''}">
          <input type="checkbox" value="${id}" ${selectedThemes.includes(id) ? 'checked' : ''}>
          <span><strong>${theme.label}</strong><small>${theme.description}</small></span>
        </label>
      `).join('')}
    </div>
    <div id="themeHelper" class="theme-helper"></div>
  `;

  panel.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', () => {
      const next = [...panel.querySelectorAll('input[type="checkbox"]:checked')].map(i => i.value);
      if (!next.length) {
        input.checked = true;
        showToast('Au moins un thème doit rester sélectionné.');
        return;
      }
      selectedThemes = next;
      saveThemes();
      renderThemePanel();
      applyThemeFilter();
    });
  });

  document.getElementById('themeAllBtn').addEventListener('click', () => {
    selectedThemes = Object.keys(THEMES);
    saveThemes();
    renderThemePanel();
    applyThemeFilter();
  });

  applyThemeFilter();
}

function installThemeSupport() {
  renderThemePanel();
  const grid = document.getElementById('skillGrid');
  if (grid) {
    const observer = new MutationObserver(() => applyThemeFilter());
    observer.observe(grid, { childList: true });
  }
}

document.addEventListener('DOMContentLoaded', installThemeSupport);
