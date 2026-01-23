import { WeakWordsManager } from './WeakWordsManager';

/**
 * Mastery Manager - Track word learning progress
 */
export class MasteryManager {
    private static getKey(wordId: string) {
        return `mastery_${wordId}`;
    }

    static getMastery(wordId: string): number {
        return parseInt(localStorage.getItem(this.getKey(wordId)) || '0');
    }

    static updateMastery(wordId: string, correct: boolean) {
        let mastery = this.getMastery(wordId);
        mastery += correct ? 20 : -10;
        mastery = Math.max(0, Math.min(100, mastery)); // Clamp 0-100
        localStorage.setItem(this.getKey(wordId), mastery.toString());
        return mastery;
    }

    static getLastStudied(wordId: string): string | null {
        return localStorage.getItem(`lastStudied_${wordId}`);
    }

    static recordStudy(wordId: string) {
        localStorage.setItem(`lastStudied_${wordId}`, new Date().toISOString());
    }

    static getTimeAgo(wordId: string): string {
        const last = this.getLastStudied(wordId);
        if (!last) return '';

        const diff = Date.now() - new Date(last).getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor(diff / (1000 * 60));

        if (days > 0) return `<span class="sv-text">Studerad ${days} dagar sedan</span><span class="ar-text">درست منذ ${days} أيام</span>`;
        if (hours > 0) return `<span class="sv-text">Studerad ${hours} timmar sedan</span><span class="ar-text">درست منذ ${hours} ساعات</span>`;
        if (mins > 0) return `<span class="sv-text">Studerad ${mins} minuter sedan</span><span class="ar-text">درست منذ ${mins} دقائق</span>`;
        return '<span class="sv-text">Nyligen</span><span class="ar-text">مؤخراً</span>';
    }

    static renderMasteryBar(wordId: string, container: HTMLElement) {
        const mastery = this.getMastery(wordId);
        const timeAgo = this.getTimeAgo(wordId);
        const isWeak = WeakWordsManager.isWeak(wordId);

        const bar = document.createElement('div');
        bar.className = 'mastery-section';
        bar.innerHTML = `
            <div class="mastery-header">
                <span class="mastery-label">
                    📈 <span class="sv-text">Behärskningsnivå</span><span class="ar-text">مستوى الإتقان</span>
                    ${isWeak ? '<span class="weak-badge">⚠️ <span class="sv-text">Svagt ord</span><span class="ar-text">كلمة ضعيفة</span></span>' : ''}
                </span>
                <span class="mastery-percent">${mastery}%</span>
            </div>
            <div class="mastery-bar">
                <div class="mastery-progress" style="width: ${mastery}%"></div>
            </div>
            ${timeAgo ? `<div class="last-studied">${timeAgo}</div>` : ''}
        `;
        container.prepend(bar);

        // Record this study
        this.recordStudy(wordId);
    }
}
