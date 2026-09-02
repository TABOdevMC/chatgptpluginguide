// Nettoyage du catalogue : retire les parcours qui recouvrent presque entièrement
// un parcours officiel existant. Les données sont conservées en mémoire pour
// éviter une modification destructive de la structure de progression.
(function () {
  'use strict';

  if (typeof COURSES === 'undefined') return;

  const DUPLICATE_IDS = new Set([
    'players',
    'adventure',
    'worldblocks',
    'entities',
    'sounds',
    'brigadier'
  ]);

  window.PAPERDEV_ARCHIVED_COURSES = window.PAPERDEV_ARCHIVED_COURSES || {};

  DUPLICATE_IDS.forEach((id) => {
    if (!COURSES[id]) return;
    window.PAPERDEV_ARCHIVED_COURSES[id] = COURSES[id];
    delete COURSES[id];
  });
})();
