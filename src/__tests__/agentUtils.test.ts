import { describe, it, expect, beforeAll } from 'vitest';
import { generateAgentResponse, searchKnowledgeBase } from '../utils/agentUtils';

describe('Agent Utils (Simplified RAG)', () => {

    // Mock global dictionary data setup
    beforeAll(() => {
        (global as any).window = {
            dictionaryData: [
                ['1', 'subst', 'testord', 'كلمة اختبار', '', '', '', 'ett testord']
            ]
        };
    });

    describe('searchKnowledgeBase', () => {
        it('should find grammar rules for "ordföljd"', () => {
            const results = searchKnowledgeBase('ordföljd');
            expect(results.length).toBeGreaterThan(0);
            expect(results[0].type).toBe('grammar');
            expect(results[0].content).toContain('Rak ordföljd');
        });

        it('should find proverbs for "bättre"', () => {
            const results = searchKnowledgeBase('bättre');
            const proverb = results.find(r => r.type === 'proverb');
            expect(proverb).toBeDefined();
            expect(proverb?.content).toContain('Bättre en fågel');
        });

        it('should return empty array for nonsense query', () => {
            const results = searchKnowledgeBase('xyz123abc');
            expect(results).toEqual([]);
        });
    }); // End searchKnowledgeBase

    describe('generateAgentResponse', () => {
        // Mock global dictionary data
        beforeAll(() => {
            (global as any).window = {
                dictionaryData: [
                    ['1', 'subst', 'testord', 'كلمة اختبار', '', '', '', 'ett testord']
                ]
            };
        });

        it('should generate a friendly greeting for "hej"', async () => {
            const response = await generateAgentResponse('hej');
            expect(response.message).toContain('Hej! Jag är din AI-språklärare');
            expect(response.message).toContain('أهلاً بك');
            expect(response.sources).toHaveLength(0);
        });

        it('should return context + sources for valid grammar query', async () => {
            const response = await generateAgentResponse('ordföljd');
            expect(response.sources.length).toBeGreaterThan(0);
            expect(response.message).toContain('Jag hittade grammatikregler som matchar');
            expect(response.message).toContain('وجدت قواعد نحوية تطابق بحثك');
        });

        it('should return a fallback message for unknown queries', async () => {
            const response = await generateAgentResponse('xyzkryptonit123');
            expect(response.message).toContain('Tyvärr'); // "Unfortunately..."
            expect(response.sources).toHaveLength(0);
        });

        it('should prioritize AI search when forceAI is true', async () => {
            // Mocking AIService
            const { AIService } = await import('../utils/agentUtils').then(() => import('../services/aiService'));

            const response = await generateAgentResponse('ordföljd', true); // forceAI = true

            expect(response.sources.filter(s => s.type === 'grammar')).toHaveLength(0);

            if (response.sources.length === 0) {
                expect(response.message).toContain('Tyvärr kunde inte AI:n hitta något');
            }
        });
    }); // End generateAgentResponse
}); // End Agent Utils
