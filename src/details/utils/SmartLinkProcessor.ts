import { DictionaryDB } from '../../db';

/**
 * Smart Link Processor - Linkifies definitions
 */
export class SmartLinkProcessor {
    static process(text: string): string {
        if (!text) return '';

        // Match words that are likely to be in the dictionary (Swedish words)
        // We look for sequences of Swedish characters, avoiding common short words or numeric refs
        return text.replace(/([a-zåäöA-ZÅÄÖ]{4,})/g, (match) => {
            return `<span class="smart-link" data-word="${match.toLowerCase()}">${match}</span>`;
        });
    }

    static setupListeners(container: HTMLElement) {
        container.querySelectorAll('.smart-link').forEach(link => {
            link.addEventListener('click', async (e) => {
                const word = (e.currentTarget as HTMLElement).dataset.word;
                if (word) {
                    // 1. Search for the word in dictionary (fast global lookup)
                    const data = (window as any).dictionaryData as any[][];
                    let found = data?.find(row => row[2].toLowerCase() === word);

                    // 2. Try DB if global data not ready
                    if (!found) {
                        try {
                            const allWords = await DictionaryDB.getAllWords();
                            found = allWords?.find(row => row[2].toLowerCase() === word);
                        } catch (err) {
                            console.warn('[SmartLink] DB fallback fail:', err);
                        }
                    }

                    if (found) {
                        window.location.href = `details.html?id=${found[0]}`;
                    } else {
                        // Fallback to home search
                        window.location.href = `index.html?s=${word}`;
                    }
                }
            });
        });
    }
}
