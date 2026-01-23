import { DictionaryDB } from '../../db';

/**
 * Related Words Manager - Enhanced with Categories & Guaranteed Results
 */
export class RelatedWordsManager {
    static async init(wordData: any[]) {
        const container = document.getElementById('relatedWordsContainer');
        if (!container) return;

        const type = wordData[1];
        const swe = wordData[2];
        const arb = wordData[3];

        // Show loading state
        container.innerHTML = `<div class="related-loading">⏳ <span class="sv-text">Laddar...</span><span class="ar-text">جاري التحميل...</span></div>`;

        // Load data directly from IndexedDB
        let allData: any[][] = (window as any).dictionaryData;
        if (!allData) {
            try {
                // DictionaryDB global assumed if not imported.
                // Using imported DictionaryDB from ../../db if available, else window
                allData = await DictionaryDB.getAllWords();
                (window as any).dictionaryData = allData; // Cache for future use
            } catch (e) {
                console.error('[RelatedWords] Failed to load data:', e);
                container.innerHTML = `<div class="related-empty">
                    <span class="sv-text">Kunde inte ladda relaterade ord</span>
                    <span class="ar-text">تعذر تحميل الكلمات ذات الصلة</span>
                </div>`;
                return;
            }
        }

        if (!allData || allData.length === 0) {
            container.innerHTML = `<div class="related-empty">
                <span class="sv-text">Inga relaterade ord hittades</span>
                <span class="ar-text">لم يتم العثور على كلمات ذات صلة</span>
            </div>`;
            return;
        }

        // Category-based Related Words
        const categories: { label: string; labelAr: string; icon: string; words: any[] }[] = [];

        // 1. Compounds (words containing this word)
        const compounds = allData.filter(row =>
            row[2] !== swe && (row[2].toLowerCase().includes(swe.toLowerCase()) || swe.toLowerCase().includes(row[2].toLowerCase()))
        ).slice(0, 4);
        if (compounds.length > 0) {
            categories.push({ label: 'Sammansatta ord', labelAr: 'كلمات مركبة', icon: '🔗', words: compounds });
        }

        // 2. Same Root (starts with same 3+ letters)
        const prefix = swe.substring(0, Math.min(3, swe.length)).toLowerCase();
        const sameRoot = allData.filter(row =>
            row[2] !== swe && row[2].toLowerCase().startsWith(prefix) && !compounds.includes(row)
        ).slice(0, 4);
        if (sameRoot.length > 0) {
            categories.push({ label: 'Liknande ord', labelAr: 'كلمات مشابهة', icon: '🌱', words: sameRoot });
        }

        // 3. Same Category (grammatical type)
        const sameType = allData.filter(row =>
            row[2] !== swe && row[1] === type && !compounds.includes(row) && !sameRoot.includes(row)
        ).sort(() => Math.random() - 0.5).slice(0, 4);
        if (sameType.length > 0) {
            // Unified: Use TypeColorSystem for labels
            const TypeColorSystem = (window as any).TypeColorSystem;
            const colorDef = TypeColorSystem ? TypeColorSystem.getColor(type) : { label: { sv: type, ar: type } };

            // sv: "Andra verbs" -> "Fler [Verb]" or "Andra [Verb]"
            // We use "Andra" + lowercase label (e.g., "Andra substantiv")
            const labelSv = `Andra ${colorDef.label.sv.toLowerCase()}`;

            // ar: "[Verb] أخرى" (Other [Verb])
            const labelAr = `${colorDef.label.ar} أخرى`;

            categories.push({ label: labelSv, labelAr: labelAr, icon: '📚', words: sameType });
        }

        // 4. Random Discovery (if no other categories)
        if (categories.length === 0 || categories.reduce((sum, c) => sum + c.words.length, 0) < 3) {
            const random = allData.filter(row => row[2] !== swe).sort(() => Math.random() - 0.5).slice(0, 6);
            categories.push({ label: 'Upptäck ord', labelAr: 'اكتشف كلمات', icon: '✨', words: random });
        }

        // Render with category headers
        container.innerHTML = categories.map(cat => `
            <div class="related-category">
                <div class="related-category-header">
                    <span class="category-icon">${cat.icon}</span>
                    <span class="sv-text">${cat.label}</span>
                    <span class="ar-text">${cat.labelAr}</span>
                </div>
                <div class="related-words-row">
                    ${cat.words.map(row => `
                        <div class="related-word-chip" onclick="window.location.href='details.html?id=${row[0]}'">
                            <span class="related-swe">${row[2]}</span>
                            <span class="related-arb">${row[3]}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }
}
