// AI Service for Gemini API integration
import { StorageSync } from '../utils/storage-sync';

export interface StorySentence {
    swedish_sentence: string;
    arabic_translation: string;
}

export interface StoryResponse {
    title_sv: string;
    title_ar: string;
    sentences: StorySentence[];
}

/**
 * Generates a short story in Swedish using the provided words.
 * Uses Gemini 1.5 Flash API via environment variables.
 * @param words Array of words to include in the story
 */
export const generateStory = async (words: string[]): Promise<StoryResponse | null> => {
    if (words.length < 3) return null;

    try {
        const prompt = `Create a short, connected narrative story (3-5 sentences) in Swedish for a language learner using these words: ${words.join(', ')}. 
        The story should be a single coherent piece of fiction, not separate examples.
        
        CRITICAL: For every single sentence in the story, you MUST provide both the Swedish text ('swedish_sentence') and its direct Arabic translation ('arabic_translation').
        
        The story must be returned as a JSON object with the following structure:
        {
          "title_sv": "Swedish Title",
          "title_ar": "Arabic Title",
          "sentences": [
            { "swedish_sentence": "Swedish sentence...", "arabic_translation": "الترجمة العربية..." },
            ...
          ]
        }`;

        const envKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
        const storageKey = StorageSync.getDeepSeekApiKey();
        const apiKey = envKey || storageKey;

        if (!apiKey) {
            throw new Error('Missing DeepSeek API Key');
        }

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: 'You are a Swedish language teacher.' },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: 'json_object' }
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("DeepSeek API Error Detail:", data);
            throw new Error(data.error?.message || `API Error ${response.status}`);
        }

        const responseText = data.choices[0].message.content;

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Could not find JSON in DeepSeek response');
        }

        const rawStory = JSON.parse(jsonMatch[0]);

        // Normalize and Sanitize Data
        let sentences: StorySentence[] = Array.isArray(rawStory.sentences)
            ? rawStory.sentences.map((s: any) => ({
                swedish_sentence: s.swedish_sentence || s.sv || s.swedish || s.sentence || "",
                arabic_translation: s.arabic_translation || s.ar || s.arabic || s.translation || ""
            }))
            : [];

        // FALLBACK: If Arabic is missing in sentences but exists as a global block
        const globalArabic = rawStory.arabic_translation || rawStory.translation || rawStory.ar || "";
        const needsFallback = sentences.some((s: StorySentence) => !s.arabic_translation || s.arabic_translation.trim() === "");

        if (needsFallback && globalArabic && globalArabic.length > 10) {
            // Smart split of global Arabic text
            // Split by period, exclamation, or question mark, but keep delimiters
            const parts = globalArabic.split(/([.!?،؟]+)/).filter((p: string) => p.trim().length > 0);

            // Re-assemble pieces into roughly sentence-sized chunks matching the count
            let arSentences: string[] = [];
            let current = "";

            parts.forEach((p: string) => {
                if (p.match(/[.!?،؟]+/)) {
                    current += p;
                    arSentences.push(current.trim());
                    current = "";
                } else {
                    current += p;
                }
            });
            if (current.trim()) arSentences.push(current.trim());

            // Assign to sentences
            sentences = sentences.map((s: StorySentence, i: number) => ({
                ...s,
                arabic_translation: s.arabic_translation || arSentences[i] || "الترجمة غير متوفرة"
            }));
        } else {
            // Default fill
            sentences = sentences.map((s: StorySentence) => ({
                ...s,
                arabic_translation: s.arabic_translation || "الترجمة غير متوفرة"
            }));
        }

        const normalizedStory: StoryResponse = {
            title_sv: rawStory.title_sv || "Berättelse",
            title_ar: rawStory.title_ar || "قصة",
            sentences: sentences
        };

        return normalizedStory;
    } catch (error: any) {
        console.error("AI Story Error:", error);
        const msg = error.message === 'Missing DeepSeek API Key'
            ? "تنبيه: مفتاح DeepSeek API غير موجود. يرجى إعداده (VITE_DEEPSEEK_API_KEY)"
            : `تنبيه: فشل جلب القصة (${error.message})`;
        alert(msg);
        return null;
    }
};

export class AIService {
    static async generateStoryFromWords(words: string[]): Promise<StoryResponse> {
        const storyData = await generateStory(words);
        if (!storyData) {
            throw new Error('Failed to generate story');
        }
        return storyData;
    }

    static hasApiKey(): boolean {
        return !!import.meta.env.VITE_DEEPSEEK_API_KEY || !!StorageSync.getDeepSeekApiKey();
    }

    static validateApiKey(apiKey: string): boolean {
        return apiKey.length > 0 && apiKey.startsWith('sk-');
    }
}