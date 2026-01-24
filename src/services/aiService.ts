// AI Service for Gemini API integration
import { StorageSync } from '../utils/storage-sync';

export interface StoryResponse {
    story_sv: string;
    story_ar: string;
}

/**
 * Generates a short story in Swedish using the provided words.
 * Uses Gemini 1.5 Flash API via environment variables.
 * @param words Array of words to include in the story
 */
export const generateStory = async (words: string[]): Promise<StoryResponse | null> => {
    if (words.length < 3) return null;

    try {
        const prompt = `أنت معلم سويدي متخصص في تعليم اللغة للمبتدئين. مهمتك هي إنشاء قصة قصيرة جداً (أقل من 40 كلمة) باستخدام هذه الكلمات: ${words.join(', ')}. 
        
        المتطلبات:
        - استخدم الكلمات المقدمة بشكل طبيعي
        - المستوى اللغوي: سويدية بسيطة (A1-A2)
        - القصة إيجابية ومتعلقة بالحياة اليومية في السويد
        - الإرجاع بتنسيق JSON فقط بدون أي نص إضافي بالتنسيق التالي:
        {
          "story_sv": "النص السويدي",
          "story_ar": "الترجمة العربية"
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
        return !!import.meta.env.VITE_GEMINI_API_KEY || !!StorageSync.getGeminiApiKey();
    }

    static validateApiKey(apiKey: string): boolean {
        return apiKey.length > 0 && apiKey.startsWith('AI');
    }
}