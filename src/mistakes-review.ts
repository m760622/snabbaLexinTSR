/**
 * Mistakes Review System
 * Track and review words the user got wrong
 */

export interface MistakeEntry {
    word: string;
    translation: string;
    game: string;
    timestamp: number;
    attempts: number;
    correctAnswer?: string;
}

const MISTAKES_KEY = 'snabbalexin_mistakes';
const MAX_MISTAKES = 50;

class MistakesManager {
    private mistakes: MistakeEntry[] = [];

    constructor() {
        this.load();
    }

    private load(): void {
        try {
            const saved = localStorage.getItem(MISTAKES_KEY);
            this.mistakes = saved ? JSON.parse(saved) : [];
        } catch {
            this.mistakes = [];
        }
    }

    private save(): void {
        // Keep only most recent mistakes
        if (this.mistakes.length > MAX_MISTAKES) {
            this.mistakes = this.mistakes.slice(-MAX_MISTAKES);
        }
        localStorage.setItem(MISTAKES_KEY, JSON.stringify(this.mistakes));
    }

    public addMistake(entry: Omit<MistakeEntry, 'timestamp' | 'attempts'>): void {
        const existing = this.mistakes.find(m => m.word === entry.word);

        if (existing) {
            existing.attempts++;
            existing.timestamp = Date.now();
        } else {
            this.mistakes.push({
                ...entry,
                timestamp: Date.now(),
                attempts: 1
            });
        }

        this.save();
    }

    public markAsLearned(word: string): void {
        this.mistakes = this.mistakes.filter(m => m.word !== word);
        this.save();
    }

    public getMistakes(): MistakeEntry[] {
        return [...this.mistakes].sort((a, b) => b.attempts - a.attempts);
    }

    public getTopMistakes(count = 10): MistakeEntry[] {
        return this.getMistakes().slice(0, count);
    }

    public getMistakeCount(): number {
        return this.mistakes.length;
    }

    public getFrequentMistakes(): MistakeEntry[] {
        return this.mistakes.filter(m => m.attempts >= 2);
    }

    public clearAll(): void {
        this.mistakes = [];
        this.save();
    }
}

export const mistakesManager = new MistakesManager();

// Global access
(window as any).mistakesManager = mistakesManager;

/**
 * Render Mistakes Review UI - XSS-Safe Implementation
 */
export function renderMistakesReview(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const mistakes = mistakesManager.getMistakes();

    // Clear container safely
    container.innerHTML = '';

    if (mistakes.length === 0) {
        // Static content - safe to use innerHTML
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'mistakes-empty';
        emptyDiv.innerHTML = `
            <div class="mistakes-empty-icon">🎉</div>
            <h3>No Mistakes Yet!</h3>
            <p>لا توجد أخطاء بعد! / Inga fel ännu!</p>
        `;
        container.appendChild(emptyDiv);
        return;
    }

    // Build header with safe DOM methods
    const header = document.createElement('div');
    header.className = 'mistakes-header';

    const h2 = document.createElement('h2');
    h2.textContent = 'مراجعة أخطائي / Mina Fel';
    header.appendChild(h2);

    const countSpan = document.createElement('span');
    countSpan.className = 'mistakes-count';
    countSpan.textContent = `${mistakes.length} كلمة / ord`;
    header.appendChild(countSpan);

    container.appendChild(header);

    // Build mistakes list with safe DOM methods
    const list = document.createElement('div');
    list.className = 'mistakes-list';

    mistakes.forEach(m => {
        const card = document.createElement('div');
        card.className = 'mistake-card';
        card.dataset.word = m.word; // Safe - dataset escapes automatically

        const wordDiv = document.createElement('div');
        wordDiv.className = 'mistake-word';
        wordDiv.textContent = m.word; // XSS-safe: textContent escapes HTML

        const translationDiv = document.createElement('div');
        translationDiv.className = 'mistake-translation';
        translationDiv.textContent = m.translation; // XSS-safe

        const metaDiv = document.createElement('div');
        metaDiv.className = 'mistake-meta';

        const attemptsSpan = document.createElement('span');
        attemptsSpan.className = 'mistake-attempts';
        attemptsSpan.textContent = `❌ ${m.attempts} مرة`;

        const gameSpan = document.createElement('span');
        gameSpan.className = 'mistake-game';
        gameSpan.textContent = m.game; // XSS-safe

        metaDiv.appendChild(attemptsSpan);
        metaDiv.appendChild(gameSpan);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'mistake-actions';

        const practiceBtn = document.createElement('button');
        practiceBtn.className = 'mistake-practice';
        practiceBtn.textContent = '🎯 تمرن / Öva';
        practiceBtn.addEventListener('click', () => {
            (window as any).practiceMistake(m.word);
        });

        const learnedBtn = document.createElement('button');
        learnedBtn.className = 'mistake-learned';
        learnedBtn.textContent = '✓ تعلمتها';
        learnedBtn.addEventListener('click', () => {
            (window as any).markLearned(m.word);
        });

        actionsDiv.appendChild(practiceBtn);
        actionsDiv.appendChild(learnedBtn);

        card.appendChild(wordDiv);
        card.appendChild(translationDiv);
        card.appendChild(metaDiv);
        card.appendChild(actionsDiv);

        list.appendChild(card);
    });

    container.appendChild(list);
}

// Global functions
(window as any).renderMistakesReview = renderMistakesReview;
(window as any).practiceMistake = (word: string) => {
    // Navigate to flashcard with this word
    // For now, redirect to learn/asma_ul_husna.html with the word to practice
    // This assumes the learning module can handle a specific word start
    window.location.href = `learn/asma_ul_husna.html?practice=${encodeURIComponent(word)}`;
};
(window as any).markLearned = (word: string) => {
    mistakesManager.markAsLearned(word);
    renderMistakesReview('mistakesContainer');
};
