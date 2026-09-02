(() => {
  'use strict';

  function completeCourseLevel(courseId, levelIndex) {
    try {
      if (typeof isComplete === 'function') return isComplete(courseId, levelIndex);
    } catch {}
    try {
      return !!window.progress?.completed?.[`${courseId}:${levelIndex}`];
    } catch {
      return false;
    }
  }

  function fixedBadgeStats() {
    const courses = Object.values(COURSES || {});
    const total = courses.reduce((sum, course) => sum + course.levels.length, 0);
    let done = 0;

    for (const course of courses) {
      for (let i = 0; i < course.levels.length; i++) {
        if (completeCourseLevel(course.id, i)) done++;
      }
    }

    const finished = courses.filter(course =>
      course.levels.every((_, i) => completeCourseLevel(course.id, i))
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
  }

  function fixedEarnedBadges() {
    const stats = fixedBadgeStats();
    return BADGE_CATALOG.filter(badge => {
      try { return badge.test(stats); }
      catch { return false; }
    });
  }

  window.badgeStats = fixedBadgeStats;
  window.earnedBadges = fixedEarnedBadges;

  function refresh() {
    try {
      if (typeof drawBadges === 'function') drawBadges();
      const count = document.querySelector('#badgeCount');
      if (count) count.textContent = `${fixedEarnedBadges().length}/${BADGE_CATALOG.length}`;
    } catch (error) {
      console.error('Erreur badges runtime:', error);
    }
  }

  window.addEventListener('paperprogresschange', refresh);
  window.addEventListener('DOMContentLoaded', refresh, { once: true });
  setTimeout(refresh, 0);
  setTimeout(refresh, 500);
  setTimeout(refresh, 1500);
})();
