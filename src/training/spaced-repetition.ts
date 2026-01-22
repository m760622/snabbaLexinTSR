/**
 * SM-2 Spaced Repetition Algorithm
 * Based on SuperMemo SM-2 with modifications for language learning
 * 
 * Quality ratings:
 * 0 - Complete blackout (Again)
 * 1 - Incorrect, but remembered upon seeing answer
 * 2 - Incorrect, but easy to recall
 * 3 - Correct with difficulty (Hard)
 * 4 - Correct with hesitation (Good)
 * 5 - Perfect recall (Easy)
 */

export interface ReviewData {
    nextReview: number;      // Unix timestamp (ms)
    interval: number;        // Days until next review
    easeFactor: number;      // Ease factor (1.3 - 2.5)
    repetitions: number;     // Successful repetition count
    lastReview?: number;     // Last review timestamp
}

export interface ReviewResult {
    newData: ReviewData;
    wasCorrect: boolean;
}

// Quality rating enum for clearer API
export enum Quality {
    Again = 0,    // Complete failure
    Hard = 3,     // Correct but difficult
    Good = 4,     // Correct with effort
    Easy = 5      // Perfect recall
}

// Initial values for new cards
export const DEFAULT_REVIEW_DATA: ReviewData = {
    nextReview: Date.now(),
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0
};

/**
 * Calculate next review based on SM-2 algorithm
 * @param quality - User's self-rating (0-5)
 * @param currentData - Current review data for the word
 * @returns Updated review data
 */
export function calculateNextReview(
    quality: number,
    currentData: ReviewData = DEFAULT_REVIEW_DATA
): ReviewResult {
    const { easeFactor, interval, repetitions } = currentData;

    // Clamp quality to valid range
    const q = Math.max(0, Math.min(5, Math.round(quality)));

    let newInterval: number;
    let newEaseFactor: number;
    let newRepetitions: number;

    // If quality < 3, reset (failed recall)
    if (q < 3) {
        newInterval = 1; // Review tomorrow
        newRepetitions = 0;
        newEaseFactor = Math.max(1.3, easeFactor - 0.2);
    } else {
        // Successful recall
        newRepetitions = repetitions + 1;

        // Calculate new ease factor: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
        newEaseFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
        newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum 1.3

        // Calculate interval
        if (newRepetitions === 1) {
            newInterval = 1; // First success: 1 day
        } else if (newRepetitions === 2) {
            newInterval = 6; // Second success: 6 days
        } else {
            // Subsequent: interval * EF
            newInterval = Math.round(interval * newEaseFactor);
        }

        // Bonus for Easy rating
        if (q === 5) {
            newInterval = Math.round(newInterval * 1.3);
        }
    }

    // Cap maximum interval at 365 days
    newInterval = Math.min(365, newInterval);

    // Calculate next review timestamp
    const now = Date.now();
    const nextReview = now + (newInterval * 24 * 60 * 60 * 1000);

    return {
        newData: {
            nextReview,
            interval: newInterval,
            easeFactor: Math.round(newEaseFactor * 100) / 100,
            repetitions: newRepetitions,
            lastReview: now
        },
        wasCorrect: q >= 3
    };
}

/**
 * Check if a word is due for review
 */
export function isDueForReview(reviewData: ReviewData): boolean {
    return Date.now() >= reviewData.nextReview;
}

/**
 * Get words sorted by review priority (most overdue first)
 */
export function sortByReviewPriority<T extends { reviewData?: ReviewData }>(
    words: T[]
): T[] {
    const now = Date.now();

    return [...words].sort((a, b) => {
        const aNext = a.reviewData?.nextReview ?? 0;
        const bNext = b.reviewData?.nextReview ?? 0;

        // New cards (no review data) come first
        if (!a.reviewData && b.reviewData) return -1;
        if (a.reviewData && !b.reviewData) return 1;

        // Then sort by how overdue they are
        return (aNext - now) - (bNext - now);
    });
}

/**
 * Get human-readable time until next review
 */
export function getTimeUntilReview(reviewData: ReviewData): string {
    const now = Date.now();
    const diff = reviewData.nextReview - now;

    if (diff <= 0) return 'Now';

    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
}

/**
 * Get button labels for quality ratings (bilingual)
 */
export const QUALITY_BUTTONS = [
    { quality: Quality.Again, label: 'Igen / مرة أخرى', color: '#ef4444', icon: '🔄' },
    { quality: Quality.Hard, label: 'Svårt / صعب', color: '#f97316', icon: '😓' },
    { quality: Quality.Good, label: 'Bra / جيد', color: '#22c55e', icon: '👍' },
    { quality: Quality.Easy, label: 'Lätt / سهل', color: '#3b82f6', icon: '🚀' }
];
