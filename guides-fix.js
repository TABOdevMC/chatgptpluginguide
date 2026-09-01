(() => {
  // Hardening for the guides reader: never lock page scrolling and keep the reader
  // in normal document flow. Also fixes the reader navigation to use the filtered list.
  const body = document.body;
  const html = document.documentElement;

  function unlockScroll() {
    body.style.removeProperty('overflow');
    body.style.removeProperty('position');
    body.style.removeProperty('height');
    html.style.removeProperty('overflow');
    html.style.removeProperty('height');
  }

  unlockScroll();

  const reader = document.getElementById('reader');
  const library = document.getElementById('library');
  const back = document.getElementById('back');

  if (!reader || !library) return;

  const showLibrary = () => {
    reader.classList.remove('open');
    reader.style.removeProperty('display');
    library.classList.remove('hidden');
    unlockScroll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showReader = () => {
    library.classList.add('hidden');
    reader.classList.add('open');
    reader.style.display = 'block';
    unlockScroll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (back) back.addEventListener('click', (event) => {
    event.preventDefault();
    showLibrary();
  });

  // Rebind dynamically created guide buttons after the library renders.
  const observer = new MutationObserver(() => {
    document.querySelectorAll('[data-id]').forEach(button => {
      if (button.dataset.guideFixBound === '1') return;
      button.dataset.guideFixBound = '1';
      button.addEventListener('click', () => {
        // Let the page's openGuide implementation build the article first.
        setTimeout(showReader, 0);
      });
    });
  });
  observer.observe(document.getElementById('content') || document.body, { childList: true, subtree: true });

  // Defensive: another script changing overflow must not be allowed to lock the guide page.
  const bodyObserver = new MutationObserver(unlockScroll);
  bodyObserver.observe(body, { attributes: true, attributeFilter: ['style', 'class'] });

  window.addEventListener('pageshow', unlockScroll);
  window.addEventListener('load', unlockScroll);
})();
