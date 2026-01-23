/**
 * Weak Words Manager - Track difficult words
 */
export class WeakWordsManager {
    private static getKey(wordId: string) {
        return `weak_${wordId}`;
    }

    static recordWrong(wordId: string) {
        const count = this.getWrongCount(wordId) + 1;
        localStorage.setItem(this.getKey(wordId), count.toString());
    }

    static recordCorrect(wordId: string) {
        // Reduce wrong count on correct answer
        const count = Math.max(0, this.getWrongCount(wordId) - 1);
        localStorage.setItem(this.getKey(wordId), count.toString());
    }

    static getWrongCount(wordId: string): number {
        return parseInt(localStorage.getItem(this.getKey(wordId)) || '0');
    }

    static isWeak(wordId: string): boolean {
        return this.getWrongCount(wordId) >= 3;
    }
}
