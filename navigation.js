(() => {
  'use strict';
  const path = location.pathname.toLowerCase();
  const isCoursePage = path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('/index.htm');
  const isGuidePage = path.includes('guides');
  const style = document.createElement('style');
  style.textContent = `
    .site-return-btn{display:inline-flex!important;align-items:center;justify-content:center;gap:.45rem;text-decoration:none!important;border:1px solid var(--border,#263653);background:var(--panel,#0f1a2b);color:var(--text,#eff5ff);border-radius:10px;padding:8px 12px;font:inherit;cursor:pointer}
    .site-return-btn:hover{border-color:var(--accent,#7f9cff)}
    .site-guide-btn{margin-left:8px}
    @media(max-width:850px){.site-guide-btn{margin-left:0}}
  `;
  document.head.appendChild(style);

  if (isCoursePage && !isGuidePage) {
    const nav = document.querySelector('.topbar nav');
    if (nav && !nav.querySelector('.site-guide-btn')) {
      const a = document.createElement('a');
      a.href = 'guides.html';
      a.className = 'nav-btn site-guide-btn';
      a.textContent = 'Guides';
      a.setAttribute('aria-label', 'Ouvrir les guides');
      a.style.textDecoration = 'none';
      a.style.display = 'inline-flex';
      a.style.alignItems = 'center';
      a.style.justifyContent = 'center';
      nav.appendChild(a);
    }
  }

  if (isGuidePage) {
    const nav = document.querySelector('.top nav, .topbar nav, header nav');
    if (nav) nav.replaceChildren();
    const header = document.querySelector('header');
    if (header) {
      const targetNav = nav || document.createElement('nav');
      if (!targetNav.parentElement) header.appendChild(targetNav);
      const back = document.createElement('a');
      back.href = 'index.html';
      back.className = 'site-return-btn';
      back.textContent = '← Retour aux cours';
      back.setAttribute('aria-label', 'Retour à la page des cours');
      targetNav.appendChild(back);
    }
  }
})();
