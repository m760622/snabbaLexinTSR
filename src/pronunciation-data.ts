/**
 * Pronunciation Data & Helpers
 */

export interface PhoneticTip {
    patter: RegExp;
    tip: { sv: string, ar: string };
    example: string;
}

export const PHONETIC_TIPS: PhoneticTip[] = [
    {
        patter: /sj|stj|skj/i,
        tip: {
            sv: "Sj-ljudet: Forma läpparna som om du ska vissla och blås ut.",
            ar: "صوت الـ Sj: شكل شفاهك كأنك ستصفر واخرج الهواء (صوت يشبه العطس الخفيف)."
        },
        example: "sju, stjärna, skjorta"
    },
    {
        patter: /ö/i,
        tip: {
            sv: "Ö: Som 'i' men med runda läppar. Tänk på 'hurt' på engelska.",
            ar: "حرف Ö: يشبه صوت حرف 'i' ولكن مع تدوير الشفاه (مثل صوت كلمة hurt بالإنجليزية)."
        },
        example: "öga, dörr"
    },
    {
        patter: /y/i,
        tip: {
            sv: "Y: Som 'i' men med läpparna långt framåt.",
            ar: "حرف Y: انطق حرف 'i' ولكن مع دفع الشفتين للأمام بحدة."
        },
        example: "ny, lyssna"
    },
    {
        patter: /r/i,
        tip: {
            sv: "R: Rullande r i början av ord, men mjukare efter vokal.",
            ar: "حرف R: يكون 'مرفرفاً' في بداية الكلمات، ويصبح ناعماً جداً إذا جاء بعد حرف علة."
        },
        example: "röd, barn"
    }
];

export const PronunciationHelper = {
    /**
     * Basic Swedish syllable splitter (Simplified heuristic)
     */
    /**
     * Advanced Swedish syllable splitter based on Golden Rules
     * 1. One vowel per syllable
     * 2. V-C-V -> V-CV (Single consonant goes to second syllable)
     * 3. V-CC-V -> VC-CV (Two consonants split)
     * 4. Best-effort compound splitting via VCCV rule
     */
    splitIntoSyllables(word: string): string[] {
        if (!word) return [];
        const vowels = 'aeiouyåäöAEIOUYÅÄÖ';

        // Find all vowel indices
        const vowelIndices: number[] = [];
        for (let i = 0; i < word.length; i++) {
            if (vowels.includes(word[i])) {
                vowelIndices.push(i);
            }
        }

        // If 0 or 1 vowel, it's a single syllable
        if (vowelIndices.length <= 1) return [word];

        const syllables: string[] = [];
        let lastSplit = 0;

        // Iterate intervals between vowels
        for (let k = 0; k < vowelIndices.length - 1; k++) {
            const v1 = vowelIndices[k];
            const v2 = vowelIndices[k + 1];

            // Consonants between vowels
            const consonants = word.substring(v1 + 1, v2);
            const numConsonants = consonants.length;

            let splitOffset = 0;

            if (numConsonants === 0) {
                // Hiatus (e.g. Boende -> Bo-en-de, Teater -> Te-a-ter)
                // Split between the vowels
                splitOffset = 1;
            } else if (numConsonants === 1) {
                // Rule 2: V-C-V -> V-CV (Lä-sa)
                // Split before the consonant
                splitOffset = 1;
            } else {
                // Rule 3: V-CC-V -> VC-CV (Kaf-fe)
                // Split after the first consonant
                splitOffset = 2; // v1 + 1 (first cons) + 1 (split after)

                // Exception check for specific indivisible pairs could go here if strongly required,
                // but user examples (Sjun-ga) suggest splitting is preferred between consonants.
            }

            const splitPoint = v1 + splitOffset;
            syllables.push(word.substring(lastSplit, splitPoint));
            lastSplit = splitPoint;
        }

        // Add the rest of the word
        syllables.push(word.substring(lastSplit));

        return syllables;
    },

    /**
     * Get tips for a word based on its spelling
     */
    getTipsForWord(word: string): PhoneticTip[] {
        return PHONETIC_TIPS.filter(tip => tip.patter.test(word));
    }
};

if (typeof window !== 'undefined') {
    (window as any).PronunciationHelper = PronunciationHelper;
}
