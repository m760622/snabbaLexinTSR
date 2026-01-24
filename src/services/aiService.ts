// AI Service for Gemini API integration
import { StorageSync } from '../utils/storage-sync';

export interface StoryResponse {
    story_sv: string;
    story_ar: string;
    explanation: string;
}

export class AIService {
    private static readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    private static readonly SYSTEM_PROMPT = `
أنت معلم سويدي متخصص في تعليم اللغة للمبتدئين. مهمتك هي إنشاء قصة قصيرة جداً (أقل من 40 كلمة) باستخدام الكلمات المقدمة.

المتطلبات:
- استخدم جميع الكلمات الخمس في القصة باستخدامها بشكل طبيعي
- المستوى اللغوي: سويدية بسيطة (A1-A2)
- القصة إيجابية ومتعلقة بالحياة اليومية في السويد
- الإرجاع بتنسيق JSON فقط بدون أي نص إضافي

التنسيق المطلوب:
{
  "story_sv": "النص السويدي",
  "story_ar": "الترجمة العربية"
}
`;

    static async generateStoryFromWords(words: string[]): Promise<StoryResponse> {
        const apiKey = StorageSync.getGeminiApiKey();

        if (!apiKey || apiKey.trim().length === 0) {
            throw new Error('Gemini API key not found. Please add your API key in settings.');
        }

        if (words.length !== 5) {
            throw new Error('Exactly 5 words are required to generate a story.');
        }

        const prompt = `
Write a very short Swedish story (less than 40 words) using these words: ${words.join(', ')}

${this.SYSTEM_PROMPT}

Respond with valid JSON format only, no additional text.
`;

        try {
            const response = await fetch(`${this.GEMINI_API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
                throw new Error('Invalid response format from Gemini API');
            }

            const responseText = data.candidates[0].content.parts[0].text;

            // Extract JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('Could not find JSON in Gemini response');
            }

            const storyData: StoryResponse = JSON.parse(jsonMatch[0]);

            // Validate response structure
            if (!storyData.story_sv || !storyData.story_ar) {
                throw new Error('Invalid story response format');
            }

            return storyData;

        } catch (error: any) {
            console.error('Gemini API Error:', error);

            if (error.message.includes('401') || error.message.includes('403')) {
                throw new Error('Invalid API key. Please check your Gemini API key in settings.');
            } else if (error.message.includes('network')) {
                throw new Error('Network error. Please check your internet connection.');
            } else {
                throw new Error(`Failed to generate story: ${error.message}`);
            }
        }
    }

    static hasApiKey(): boolean {
        return !!StorageSync.getGeminiApiKey();
    }

    static validateApiKey(apiKey: string): boolean {
        return apiKey.length > 0 && apiKey.startsWith('AI');
    }
}