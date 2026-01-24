import { DictionaryDB } from '../../db';

const STORAGE_KEY = 'wod_state';

export interface WordDNAState {
    date: string;       // YYYY-MM-DD
    wordId: string | null;
    isCompleted: boolean; // Has the user finished the story?
    lastSegmentIndex: number;
}

/**
 * Deterministic Random Number Generator based on seed
 */
function sfc32(a: number, b: number, c: number, d: number) {
    return function () {
        a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
        var t = (a + b) | 0;
        a = b ^ b >>> 9;
        b = c + (c << 3) | 0;
        c = (c << 21 | c >>> 11);
        d = d + 1 | 0;
        t = t + d | 0;
        c = c + t | 0;
        return (t >>> 0) / 4294967296;
    }
}

export const DNALogic = {
    /**
     * Get today's date string (YYYY-MM-DD) in local time
     */
    getTodayString(): string {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Get the stored state for today
     */
    getStoredState(): WordDNAState {
        const today = this.getTodayString();
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.date === today) {
                    return parsed;
                }
            }
        } catch (e) {
            console.error('Failed to parse WOD state', e);
        }

        // Default state for today
        return {
            date: today,
            wordId: null,
            isCompleted: false,
            lastSegmentIndex: 0
        };
    },

    /**
     * Save state
     */
    saveState(state: Partial<WordDNAState>) {
        const current = this.getStoredState();
        const newState = { ...current, ...state };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    },

    /**
     * Get the word for today (Deterministic)
     */
    async getDailyWord(forceNew: boolean = false): Promise<any | null> {
        const today = this.getTodayString();
        const state = this.getStoredState();

        // If not forcing a new one and we have a stored ID for today, use it
        if (!forceNew && state.wordId) {
            const allWords = (window as any).dictionaryData as any[][];
            let foundWord = null;
            if (allWords) {
                foundWord = allWords.find((w: any) => (Array.isArray(w) ? w[0].toString() : w.id?.toString()) === state.wordId);
            }

            if (foundWord) return this.normalizeWord(foundWord);

            // Fallback to DB
            await DictionaryDB.init();
            const dbWord = await DictionaryDB.getWordById(state.wordId);
            if (dbWord) return this.normalizeWord(dbWord);
        }

        // Picking logic
        let allWords = (window as any).dictionaryData as any[][];
        if (!allWords || allWords.length === 0) {
            await DictionaryDB.init();
            allWords = await DictionaryDB.getAllWords();
        }

        if (!allWords || allWords.length === 0) return null;

        // Calculate seed from date
        let hash = 0;
        const seedStr = forceNew ? today + Date.now() : today;
        for (let i = 0; i < seedStr.length; i++) {
            hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
            hash |= 0;
        }

        const seed = Math.abs(hash);
        const rng = sfc32(seed, seed * 2, seed * 3, seed * 4);
        const randomIndex = Math.floor(rng() * allWords.length);
        const word: any = allWords[randomIndex];
        const id = Array.isArray(word) ? word[0].toString() : (word?.id?.toString() || '');

        if (id) {
            this.saveState({ date: today, wordId: id, isCompleted: false });
        }

        return this.normalizeWord(word);
    },

    normalizeWord(word: any) {
        if (!word) return null;
        let base: any = {};
        if (Array.isArray(word)) {
            base = {
                id: word[0],
                type: word[1],
                swe: word[2],
                arb: word[3],
                arbExt: word[4],
                sweDef: word[5],
                sweEx: word[7],
                arbEx: word[8]
            };
        } else {
            base = { ...word };
        }

        // --- ENRICHMENT FOR ADVANCED VIEWS ---

        // 1. Morphology Lab Data (Mocked if missing)
        if (!base.forms) {
            const stem = base.swe.endsWith('a') ? base.swe.slice(0, -1) : base.swe;
            base.forms = [
                { label: 'Singular', swe: base.swe, arb: 'المفرد' },
                { label: 'Plural', swe: stem + 'or', arb: 'الجمع' },
                { label: 'Past', swe: stem + 'ade', arb: 'الماضي' },
                { label: 'Present', swe: stem + 'ar', arb: 'المضارع' }
            ];
        }

        // 2. Semantic Map Data (Synonyms/Antonyms)
        if (!base.related) {
            base.related = [
                { word: 'Viktig', type: 'synonym', arb: 'مهم' },
                { word: 'Härlig', type: 'synonym', arb: 'رائع' },
                { word: 'Liten', type: 'antonym', arb: 'صغير' },
                { word: 'Snabb', type: 'related', arb: 'سريع' }
            ];
        }

        // 3. Etymology DNA
        if (!base.history) {
            base.history = {
                origin: 'Fornnordiska (Old Norse)',
                note: `Ordet "${base.swe}" har sina rötter i germanska språk. Det användes ursprungligen för att beskriva handlingar i vardagslivet.`,
                arabicNote: `تعود جذور هذه الكلمة إلى اللغات الجرمانية القديمة، وكانت تستخدم لوصف الأنشطة اليومية.`
            };
        }

        return base;
    },

    markComplete() {
        this.saveState({ isCompleted: true, lastSegmentIndex: 3 });
        const currentPoints = parseInt(localStorage.getItem('userPoints') || '0');
        localStorage.setItem('userPoints', (currentPoints + 10).toString());
        window.dispatchEvent(new CustomEvent('pointsUpdated', { detail: { points: currentPoints + 10 } }));
    }
};
