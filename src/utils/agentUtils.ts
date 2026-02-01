import { AIService } from '../services/aiService';
import { grammarDatabase } from '../data/grammarData';
import ordsprakData from '../data/ordsprak.json';

export interface SearchResult {
    type: 'grammar' | 'proverb' | 'general';
    title: string;
    content: string;
    translation?: string;
    example?: string;
    source?: string;
}

export interface AgentResponse {
    message: string;
    sources: SearchResult[];
}

/**
 * Searches the local "Knowledge Base" (grammar and proverbs)
 * This acts as a simplified RAG (Retrieval Augmented Generation) logic.
 */
export const searchKnowledgeBase = (query: string): SearchResult[] => {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) return [];

    const keywords = lowerQuery.split(/\s+/).filter(w => w.length > 2); // Filter small words

    // 1. Search Grammar Database
    Object.entries(grammarDatabase).forEach(([category, examples]) => {
        // Check category name match
        if (category.includes(lowerQuery)) {
            results.push({
                type: 'grammar',
                title: `Grammatik: ${category}`,
                content: `Hittade ${examples.length} exempel i kategorin ${category}.`,
                source: 'Grammatikdatabasen'
            });
        }

        // Check examples
        examples.forEach(ex => {
            const sentence = ex.words.join(' ').toLowerCase();
            const explanation = ex.explanation.toLowerCase();
            const explanationAr = ex.explanationAr.toLowerCase();

            // Check if ANY keyword matches
            const isMatch = keywords.some(keyword =>
                sentence.includes(keyword) ||
                explanation.includes(keyword) ||
                explanationAr.includes(keyword)
            );

            if (isMatch) {
                results.push({
                    type: 'grammar',
                    title: isMatch ? 'Grammatikexempel' : category, // Dynamic title
                    content: ex.explanation,
                    translation: ex.explanationAr,
                    example: `${ex.words.join(' ')} \n(${ex.hint.replace('Översätt: ', '')})`,
                    source: 'Grammatik Regler'
                });
            }
        });
    });

    // 2. Search Proverbs (Ordsprak)
    // @ts-ignore - json import structure validation
    ordsprakData.forEach((item: any) => {
        const swedish = item.swedishProverb.toLowerCase();
        const literal = item.literalMeaning.toLowerCase();
        const arabic = item.arabicEquivalent.toLowerCase();

        const isMatch = keywords.some(keyword =>
            swedish.includes(keyword) ||
            literal.includes(keyword) ||
            arabic.includes(keyword)
        );

        if (isMatch) {
            results.push({
                type: 'proverb',
                title: 'Ordspråk / المثل',
                content: item.swedishProverb,
                translation: item.arabicEquivalent,
                example: `Betydelse: ${item.literalMeaning}`,
                source: 'Ordspråksdatabasen'
            });
        }
    });

    // 3. Special handling for generic "Ordspråk" query
    // If the user explicitly asks for "Ordspråk" or "Proverbs" but didn't specify which one,
    // show them some random examples instead of nothing.
    if (results.length === 0 && (lowerQuery.includes('ordspråk') || lowerQuery.includes('proverb') || lowerQuery.includes('مثل') || lowerQuery.includes('أمثال'))) {
        // Shuffle and pick 3 random proverbs
        const randomProverbs = [...ordsprakData]
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        randomProverbs.forEach((item: any) => {
            results.push({
                type: 'proverb',
                title: 'Slumpmässigt Ordspråk / مثل عشوائي',
                content: item.swedishProverb,
                translation: item.arabicEquivalent,
                example: `Betydelse: ${item.literalMeaning}`,
                source: 'Ordspråksdatabasen'
            });
        });
    }

    // Limit results to avoid overwhelming the UI
    return results.slice(0, 5);
};

/**
 * Generates a "System Prompt" style response based on search results.
 */
// ... imports

/**
 * Generates a "System Prompt" style response based on search results.
 */
export const generateAgentResponse = async (query: string, forceAI = false): Promise<AgentResponse> => {
    const lowerQuery = query.toLowerCase().trim();

    // 0. Handle Greetings (Skip if forcing AI)
    if (!forceAI) {
        const greetings = ['hej', 'tja', 'hallå', 'salam', 'marhaba', 'hi', 'hello'];
        if (greetings.some(g => lowerQuery.includes(g)) && lowerQuery.length < 10) {
            return {
                message: "Hej! Jag är din AI-språklärare. Fråga mig om grammatik (t.ex. 'ordföljd') eller ordspråk! / 🤖 أهلاً بك! أنا معلمك الذكي. اسألني عن القواعد أو الأمثال.",
                sources: []
            };
        }
    }

    // 1. Primary Search: Knowledge Base (Grammar & Proverbs)
    let results = forceAI ? [] : searchKnowledgeBase(query);
    let message = '';
    let foundInDictionary = false;

    // 2. Fallback Search: Main Dictionary (Skip if forcing AI or if KB found results)
    if (results.length === 0 && !forceAI) {
        console.log('[Agent] Fallback search initiated for:', lowerQuery);
        const dictionaryData = (window as any).dictionaryData as any[][];

        if (!dictionaryData) {
            console.error('[Agent] dictionaryData is missing from window object!');
            message = "Systemfel: Ordboken är inte laddad. Prova att ladda om sidan. / خطأ في النظام: القاموس غير محمل. حاول تحديث الصفحة.";
            return { message, sources: [] };
        }

        if (dictionaryData.length === 0) {
            console.warn('[Agent] dictionaryData is empty!');
            message = "Ordboken laddas fortfarande... Vänta en stund och försök igen. / جاري تحميل القاموس... انتظر قليلاً وحاول مرة أخرى.";
            return { message, sources: [] };
        }

        console.log('[Agent] Dictionary size:', dictionaryData.length);

        // Advanced Normalization for Search
        const normalizeSearch = (text: string) => {
            return text
                .replace(/[\u064B-\u065F]/g, '') // Remove tashkeel
                .replace(/[أإآ]/g, 'ا') // Normalize Alefs
                .replace(/ة/g, 'ه') // Normalize Ta-Marbuta
                .toLowerCase();
        };

        const normQuery = normalizeSearch(lowerQuery);

        const match = dictionaryData.find(row => {
            const sv = (row[2] || '').toLowerCase();
            const arRaw = (row[3] || '');
            const arNorm = normalizeSearch(arRaw);
            const isSvMatch = sv === lowerQuery || (lowerQuery.length > 3 && sv.startsWith(lowerQuery));
            const isArMatch = arNorm.includes(normQuery);
            return isSvMatch || isArMatch;
        });

        if (match) {
            foundInDictionary = true;
            console.log('[Agent] Match found:', match[2]);
            let typeLabel = 'Ord / كلمة';
            const type = (match[1] || '').toLowerCase();
            if (type.includes('verb')) typeLabel = 'Verb / فعل';
            else if (type.includes('subst')) typeLabel = 'Substantiv / اسم';
            else if (type.includes('adj')) typeLabel = 'Adjektiv / صفة';

            results.push({
                type: 'general',
                title: `${match[2]} (${typeLabel})`,
                content: match[2],
                translation: match[3],
                example: match[7] ? `Exempel: ${match[7]}` : undefined,
                source: 'Svensk-Arabiskt Lexikon'
            });
        } else {
            console.log('[Agent] No match found in dictionary for:', lowerQuery);
        }
    }

    // 3. AI Fallback (DeepSeek/ChatGPT)
    if ((!foundInDictionary || forceAI) && AIService.hasApiKey()) {
        console.log(forceAI ? '[Agent] Forcing AI search...' : '[Agent] Dictionary failed, trying AI...');
        try {
            const aiResult = await AIService.searchWord(query);
            if (aiResult) {
                results.push({
                    type: 'general',
                    title: aiResult.title,
                    content: aiResult.content,
                    translation: aiResult.translation,
                    example: aiResult.example ? `Exempel: ${aiResult.example}` : undefined,
                    source: 'AI Assistant (DeepSeek)'
                });
            }
        } catch (e) {
            console.error('[Agent] AI search error:', e);
        }
    }

    // Special message for explicit AI search failure
    if (forceAI && results.length === 0) {
        message = `Tyvärr kunde inte AI:n hitta något om "${query}" just nu. / للأسف لم يستطع الذكاء الاصطناعي إيجاد شيء حالياً.`;
        return { message, sources: [] };
    }

    if (results.length > 0) {
        const types = results.map(r => r.type);
        const hasGrammar = types.includes('grammar');
        const hasProverb = types.includes('proverb');
        const hasGeneral = types.includes('general');

        if (forceAI) {
            message = `Här är vad AI:n hittade om "${query}": / إليك ما وجده الذكاء الاصطناعي عن "${query}":`;
        } else if (hasGrammar && hasProverb) {
            message = `Här är vad jag hittade om "${query}" i både grammatik och ordspråk! / إليك ما وجدته حول "${query}" في القواعد والأمثال!`;
        } else if (hasGrammar) {
            message = `Jag hittade grammatikregler som matchar "${query}". Titta på exemplen nedan: / وجدت قواعد نحوية تطابق بحثك. انظر الأمثلة أدناه:`;
        } else if (hasProverb) {
            message = `Ett ordspråk passar perfekt in här! / وجدت مثلاً يناسب هذا السياق!`;
        } else if (hasGeneral) {
            const lastResult = results[results.length - 1];
            if (lastResult.source && lastResult.source.includes('AI')) {
                message = `Jag hittade detta via AI: / وجدت هذا عبر الذكاء الاصطناعي:`;
            } else {
                message = `Jag hittade ordet i ordboken: / وجدت الكلمة في القاموس:`;
            }
        } else {
            message = `Här är några relevanta exempel från databasen: / إليك بعض الأمثلة ذات الصلة من قاعدة البيانات:`;
        }
    } else {
        const hasKey = AIService.hasApiKey();
        message = `Tyvärr hittade jag inget om "${query}" i databasen${hasKey ? ' eller via AI' : ''}. \n\n للأسف لم أجد شيئاً. ${!hasKey ? '\n💡 Tips: Lägg till en API-nyckel i inställningarna för att aktivera AI-sökning!' : ''}`;
    }

    return {
        message,
        sources: results
    };
};
