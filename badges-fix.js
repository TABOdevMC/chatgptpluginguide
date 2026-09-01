(() => {
  // Compatibilité avec app.js : les badges utilisaient auparavant complete().
  // On se base directement sur la source de vérité isComplete().
  const badgeComplete = (courseId, levelIndex) => {
    if (typeof isComplete === 'function') return isComplete(courseId, levelIndex);
    const k = `${courseId}:${levelIndex}`;
    return !!window.progress?.completed?.[k];
  };

  const waitForBadges = () => {
    if (typeof BADGE_CATALOG === 'undefined' || typeof COURSES === 'undefined') {
      setTimeout(waitForBadges, 50);
      return;
    }

    // Les fonctions existantes sont remplacées avec une version robuste.
    window.complete = badgeComplete;

    const originalBadgeStats = window.badgeStats;
    window.badgeStats = function fixedBadgeStats() {
      const courses = Object.values(COURSES);
      const total = courses.reduce((sum, course) => sum + course.levels.length, 0);
      let done = 0;

      for (const course of courses) {
        for (let i = 0; i < course.levels.length; i++) {
          if (badgeComplete(course.id, i)) done++;
        }
      }

      const finished = courses.filter(course =>
        course.levels.every((_, i) => badgeComplete(course.id, i))
      ).length;

      const streak = typeof learningStreak === 'function'
        ? learningStreak()
        : { current: 0, active: false };

      return {
        total,
        done,
        pct: total ? Math.round(done / total * 100) : 0,
        finished,
        totalCourses: courses.length,
        streak: streak.current,
        activeStreak: streak.active
      };
    };

    // Recalcule immédiatement l'affichage après une validation.
    const refresh = () => {
      try {
        if (typeof renderProgress === 'function') renderProgress();
        if (typeof renderBadges === 'function') renderBadges();
      } catch (error) {
        console.error('Erreur badge:', error);
      }
    };

    const oldSubmitAnswer = window.submitAnswer;
    if (typeof oldSubmitAnswer === 'function' && !oldSubmitAnswer.__badgeFixed) {
      const wrapped = function(...args) {
        const result = oldSubmitAnswer.apply(this, args);
        setTimeout(refresh, 0);
        return result;
      };
      wrapped.__badgeFixed = true;
      window.submitAnswer = wrapped;
    }

    refresh();
  };

  waitForBadges();
})();
