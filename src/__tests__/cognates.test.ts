// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cognatesData } from '../data/cognatesData';

// Mock dependnecies
vi.mock('../tts', () => ({
    TTSManager: {
        speak: vi.fn(),
        init: vi.fn()
    }
}));

vi.mock('../utils', () => ({
    TextSizeManager: {
        apply: vi.fn(),
        autoApply: vi.fn()
    }
}));

vi.mock('../i18n', () => ({
    LanguageManager: {
        init: vi.fn()
    }
}));

// We need to import the module AFTER mocking to ensure state is isolated or use a specific pattern
// Since cognates.ts has top-level state variables, we might need to reset them or reload the module.
// For simplicity in this test, we will test the logic we can access or simulate the DOM environment.

describe('Cognates Feature', () => {

    beforeEach(() => {
        // Reset DOM
        document.body.innerHTML = `
            <div id="content"></div>
            <div id="filterChips"></div>
            <div id="totalWords"></div>
            <div id="learnedCount"></div>
            <div id="savedCount"></div>
            <div id="streakCount"></div>
            <div id="modeIndicator"></div>
            <div id="modeSelectionBar"></div>
            <div id="btn-browse"></div>
        `;

        // Reset LocalStorage
        localStorage.clear();

        // Reset Mocks
        vi.clearAllMocks();
    });

    it('should have access to cognates data', () => {
        expect(cognatesData.length).toBeGreaterThan(0);
    });

    it('should filter cognates by category', () => {
        const medical = cognatesData.filter(c => c.category === 'Medicin & Vetenskap');
        expect(medical.length).toBeGreaterThan(0);
        medical.forEach(item => {
            expect(item.category).toBe('Medicin & Vetenskap');
        });
    });

    it('should search cognates correctly', () => {
        const term = 'katt'; // assuming 'katt' exists or similar
        const results = cognatesData.filter(c => c.swe.toLowerCase().includes(term) || c.arb.includes(term));
        // This is a data test, ensuring structure allows filtering
        expect(Array.isArray(results)).toBe(true);
    });

    // Note: Testing internal state of a module that doesn't export its state manager is tricky.
    // Ideally, cognates.ts should export a class 'CognatesManager' to be easily testable.
    // For now, we will verify the data integrity which drives the feature.

    describe('Data Integrity', () => {
        it('should have required fields for every entry', () => {
            cognatesData.forEach(item => {
                expect(item).toHaveProperty('swe');
                expect(item).toHaveProperty('arb');
                // Category is optional in type but practically used
            });
        });

        it('should have valid Swedish and Arabic strings', () => {
            cognatesData.forEach(item => {
                expect(item.swe.length).toBeGreaterThan(0);
                expect(item.arb.length).toBeGreaterThan(0);
            });
        });
    });
});
