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

        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || 'API Error');

        const responseText = data.candidates[0].content.parts[0].text;

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Could not find JSON in Gemini response');
        }

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("AI Story Error:", error);
        alert("تنبيه: لم نتمكن من جلب القصة، تأكد من إعداد API Key (VITE_GEMINI_API_KEY) في إعدادات البيئة");
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