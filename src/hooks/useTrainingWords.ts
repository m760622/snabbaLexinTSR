/**
 * useTrainingWords - Custom hook for training words management
 * Fetches words from IndexedDB and provides update functions
 */
import { useState, useEffect, useCallback } from 'react';
import { DictionaryDB } from '../db';
import { AppConfig } from '../config';

export interface TrainingWord {
    id: string;
    swedish: string;
    arabic: string;
    arabicExt?: string;
    type?: string;
    definition?: string;
    example?: string;
}

interface UseTrainingWordsResult {
    words: TrainingWord[];
    isLoading: boolean;
    error: string | null;
    currentIndex: number;
    currentWord: TrainingWord | null;
    remainingCount: number;
    totalCount: number;
    masteredCount: number;
    markAsMastered: (wordId: string) => Promise<void>;
    nextWord: () => void;
    prevWord: () => void;
    refresh: () => Promise<void>;
}

export function useTrainingWords(): UseTrainingWordsResult {
    const [words, setWords] = useState<TrainingWord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [masteredCount, setMasteredCount] = useState(0);

    // Transform raw word data to TrainingWord interface
    const transformWord = (raw: any): TrainingWord => {
        // Handle array format from db.ts (raw field)
        if (Array.isArray(raw)) {
            return {
                id: raw[AppConfig.COLUMNS.ID] || '',
                swedish: raw[AppConfig.COLUMNS.SWEDISH] || '',
                arabic: raw[AppConfig.COLUMNS.ARABIC] || '',
                arabicExt: raw[AppConfig.COLUMNS.ARABIC_EXT] || '',
                type: raw[AppConfig.COLUMNS.TYPE] || '',
                definition: raw[AppConfig.COLUMNS.DEFINITION] || '',
                example: raw[AppConfig.COLUMNS.EXAMPLE_SWE] || ''
            };
        }
        // Handle object format
        return {
            id: raw.id || raw[0] || '',
            swedish: raw.swe || raw.swedish || raw[2] || '',
            arabic: raw.arb || raw.arabic || raw[3] || '',
            arabicExt: raw.arbExt || raw[4] || '',
            type: raw.type || raw[1] || '',
            definition: raw.sweDef || raw[5] || '',
            example: raw.sweEx || raw[7] || ''
        };
    };

    // Fetch training words
    const fetchWords = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            await DictionaryDB.init();
            const rawWords = await DictionaryDB.getTrainingWords();
            const transformedWords = rawWords.map(transformWord).filter(w => w.id && w.swedish);
            setWords(transformedWords);
            setCurrentIndex(0);
        } catch (err) {
            console.error('[useTrainingWords] Error:', err);
            setError('Kunde inte ladda träningsord / تعذر تحميل كلمات التدريب');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Mark word as mastered (remove from training)
    const markAsMastered = useCallback(async (wordId: string) => {
        try {
            await DictionaryDB.updateTrainingStatus(wordId, false);

            // Optimistic UI update
            setWords(prev => {
                const newWords = prev.filter(w => w.id !== wordId);
                // Adjust current index if needed
                if (currentIndex >= newWords.length && newWords.length > 0) {
                    setCurrentIndex(newWords.length - 1);
                }
                return newWords;
            });

            setMasteredCount(prev => prev + 1);
        } catch (err) {
            console.error('[useTrainingWords] Error marking as mastered:', err);
        }
    }, [currentIndex]);

    // Navigation
    const nextWord = useCallback(() => {
        if (words.length === 0) return;
        setCurrentIndex(prev => (prev + 1) % words.length);
    }, [words.length]);

    const prevWord = useCallback(() => {
        if (words.length === 0) return;
        setCurrentIndex(prev => (prev - 1 + words.length) % words.length);
    }, [words.length]);

    // Initial fetch
    useEffect(() => {
        fetchWords();
    }, [fetchWords]);

    return {
        words,
        isLoading,
        error,
        currentIndex,
        currentWord: words[currentIndex] || null,
        remainingCount: words.length,
        totalCount: words.length + masteredCount,
        masteredCount,
        markAsMastered,
        nextWord,
        prevWord,
        refresh: fetchWords
    };
}
