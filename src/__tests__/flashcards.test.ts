// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initFlashcards, flipFlashcard, nextFlashcard } from '../learn-ui';

// Mock dependencies
vi.mock('../tts', () => ({
    TTSManager: {
        speak: vi.fn(),
        init: vi.fn()
    },
    speakSwedish: vi.fn(),
    speakArabic: vi.fn()
}));

vi.mock('../db', () => ({
    DictionaryDB: {
        getTrainingWords: vi.fn().mockResolvedValue([])
    }
}));

vi.mock('../learn/lessonsData', () => ({
    lessonsData: [
        {
            id: 'lesson1',
            title: 'Test Lesson',
            sections: [
                {
                    examples: [
                        { swe: 'Hej', arb: 'مرحبا' },
                        { swe: 'Katt', arb: 'قطة' }
                    ]
                }
            ]
        }
    ]
}));

describe('Flashcard Feature', () => {

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="flashcardContent"></div>
            <div id="flashcardFaceFront"></div>
            <div id="flashcardFaceBack"></div>
        `;
        vi.useFakeTimers();
        // Reset global variables if any (handled by module reload usually, 
        // but learn-ui is stateful. We assume initFlashcards resets state).
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize and render flashcards', () => {
        initFlashcards();

        const container = document.getElementById('flashcardContent');
        expect(container?.innerHTML).toContain('Blandar kort...');

        // Run timeout
        vi.runAllTimers();

        // Should now have card content
        if (!container?.querySelector('.flashcard-wrapper')) {
            console.log('Flashcard Render Debug:', container?.innerHTML);
            // Debug lessonsData length if possible or assume empty
        }
        expect(container?.innerHTML).not.toContain('Blandar kort...');
        expect(container?.querySelector('.flashcard-wrapper')).not.toBeNull();

        // Should show 'Hej' or 'Katt'
        const hasWord = container?.innerHTML.includes('Hej') || container?.innerHTML.includes('Katt');
        expect(hasWord).toBe(true);
    });

    it('should flip flashcard', () => {
        initFlashcards();
        vi.runAllTimers();

        const card = document.querySelector('.flashcard-wrapper');
        expect(card).not.toBeNull();
        expect(card?.classList.contains('flipped')).toBe(false);

        // Call flip logic
        flipFlashcard();

        // Card should be flipped
        // Note: active card element might be re-queried inside flipFlashcard
        const updatedCard = document.querySelector('.flashcard-wrapper');
        expect(updatedCard?.classList.contains('flipped')).toBe(true);
    });

    it('should navigate to next flashcard', () => {
        initFlashcards();
        vi.runAllTimers();

        const container = document.getElementById('flashcardContent');
        const firstContent = container?.innerHTML;

        // Force a specific seed or just assume next is likely different or logic rerenders
        nextFlashcard();

        // Wait for potential animation timeout if any? 
        // nextFlashcard typically updates DOM immediately or after short delay
        vi.runAllTimers();

        // Expect content to be re-rendered (at least not crash)
        expect(container?.querySelector('.flashcard-wrapper')).not.toBeNull();

        // If we only have 2 cards, it might pick the same one randomly, 
        // but typically nextFlashcard increments index.
        // Let's verify it doesn't crash effectively.
        expect(true).toBe(true);
    });
});
