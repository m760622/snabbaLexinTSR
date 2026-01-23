/**
 * Daily Streak Manager - Track consecutive study days
 */
export class DailyStreakManager {
    private static STREAK_KEY = 'dailyStreak';
    private static LAST_DATE_KEY = 'lastStudyDate';

    static checkAndUpdateStreak(): number {
        const today = new Date().toDateString();
        const lastDate = localStorage.getItem(this.LAST_DATE_KEY);
        let streak = parseInt(localStorage.getItem(this.STREAK_KEY) || '0');

        if (lastDate === today) {
            // Already studied today
            return streak;
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate === yesterday.toDateString()) {
            // Studied yesterday - continue streak
            streak++;
        } else if (lastDate !== today) {
            // Streak broken - reset
            streak = 1;
        }

        localStorage.setItem(this.STREAK_KEY, streak.toString());
        localStorage.setItem(this.LAST_DATE_KEY, today);

        return streak;
    }

    static getStreak(): number {
        return parseInt(localStorage.getItem(this.STREAK_KEY) || '0');
    }

    static renderStreakBadge(container: HTMLElement) {
        const streak = this.checkAndUpdateStreak();
        if (streak < 2) return;

        const badge = document.createElement('div');
        badge.className = 'daily-streak-badge';
        badge.innerHTML = `
            <span class="streak-fire">🔥</span>
            <span class="sv-text">${streak} dagar i rad!</span><span class="ar-text">${streak} أيام متتالية!</span>
        `;
        container.prepend(badge);
    }
}
