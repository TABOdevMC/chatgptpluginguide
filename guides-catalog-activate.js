(() => {
  if (!Array.isArray(window.GUIDE_LIBRARY_PLUS) || !Array.isArray(window.GUIDE_LIBRARY)) return;
  window.GUIDE_LIBRARY.splice(0, window.GUIDE_LIBRARY.length, ...window.GUIDE_LIBRARY_PLUS);
})();
