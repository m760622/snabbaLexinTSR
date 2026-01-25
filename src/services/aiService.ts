// AI Service for Gemini API integration
import { StorageSync } from '../utils/storage-sync';

export interface StoryResponse {
    title_sv: string;
    title_ar: string;
    sentences: {
        sv: string;
        ar: string;
    }[];
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
        
        CRITICAL: For every single sentence in the story, you MUST provide both the Swedish text ('sv') and its direct Arabic translation ('ar').
        
        The story must be returned as a JSON object with the following structure:
        {
          "title_sv": "Swedish Title",
          "title_ar": "Arabic Title",
          "sentences": [
            { "sv": "Swedish sentence...", "ar": "الترجمة العربية..." },
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

        return JSON.parse(jsonMatch[0]);
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