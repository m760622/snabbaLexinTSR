
import { normalizeArabic, TextSizeManager, levenshteinDistance } from '../utils';
import { TypeColorSystem } from '../type-color-system';
import { FavoritesManager } from '../favorites';
import { SearchHistoryManager } from '../search-history';
import { QuizStats } from '../quiz-stats';

export class SearchManager {
    private searchIndex: string[] = [];
    private searchIndexArabic: string[] = [];
    private typeCategoryCache: Map<string, string> = new Map();
    private currentResults: any[][] = [];
    private data: any[][] = []; // Store full data

    // Filter State
    public activeFilterMode = 'all';
    public activeTypeFilter = 'all';
    public activeSortMethod = 'relevance';

    // Cache for training words
    private trainingIds: Set<string> = new Set();

    // DOM Elements
    private searchInput: HTMLInputElement | null = null;
    private landingPage: HTMLElement | null = null;
    private searchResults: HTMLElement | null = null;
    private emptyState: HTMLElement | null = null;
    private clearSearchBtn: HTMLElement | null = null;
    private backdrop: HTMLElement | null = null;

    constructor() {
        this.cacheDOM();
        this.bindEvents();
    }

    private cacheDOM() {
        this.searchInput = document.getElementById('searchInput') as HTMLInputElement;
        this.landingPage = document.getElementById('landingPageContent');
        this.searchResults = document.getElementById('searchResults');
        this.emptyState = document.getElementById('emptyState');
        this.clearSearchBtn = document.getElementById('clearSearch');

        // Backdrop REMOVED per user request
        this.backdrop = null;
        /* 
        this.backdrop = document.getElementById('searchBackdrop');
        if (!this.backdrop) {
            this.backdrop = document.createElement('div');
            this.backdrop.id = 'searchBackdrop';
            this.backdrop.className = 'search-backdrop hidden';
            document.body.appendChild(this.backdrop);
        }
        */
    }

    private bindEvents() {
        if (!this.searchInput) return;

        // Focus / Blur for Immersive Mode
        this.searchInput.addEventListener('focus', () => this.enableFocusMode());
        this.searchInput.addEventListener('blur', () => {
            // Delay blur to allow clicking on suggestions
            setTimeout(() => this.disableFocusMode(), 200);
        });

        // Input Event for Live Autocomplete
        this.searchInput.addEventListener('input', (e) => {
            const val = (e.target as HTMLInputElement).value;
            this.handleInput(val);
            this.updateDropdown(val);
        });

        // Clear Button
        if (this.clearSearchBtn) {
            this.clearSearchBtn.addEventListener('click', () => {
                if (this.searchInput) {
                    this.searchInput.value = '';
                    this.searchInput.focus();
                    this.handleInput('');
                    this.updateDropdown('');
                }
            });
        }
    }

    // --- Public API ---

    public initData(data: any[][]) {
        console.time('[SearchManager] initData');
        this.data = data; // Store reference
        this.searchIndex = data.map(row => row[2].toLowerCase());
        this.searchIndexArabic = data.map(row => normalizeArabic(row[3] || '').toLowerCase());

        // Pre-cache types
        this.typeCategoryCache.clear();
        data.forEach((row, index) => {
            const cacheKey = `${index}`;
            // Use detect() instead of getCategory()
            const result = TypeColorSystem.detect(row[1], row[2], row[6], row[13] || '', row[3] || '');
            this.typeCategoryCache.set(cacheKey, result.type);
        });
        console.timeEnd('[SearchManager] initData');
    }

    public setTrainingIds(ids: Set<string>) {
        this.trainingIds = ids;
    }

    public handleInput(query: string) {
        // Toggle Clear Button
        if (this.clearSearchBtn) {
            if (query.length > 0) {
                this.clearSearchBtn.classList.remove('hidden');
                this.clearSearchBtn.style.display = 'flex';
            } else {
                this.clearSearchBtn.classList.add('hidden');
                this.clearSearchBtn.style.display = '';
            }
        }

        // Perform Search
        this.performSearch(query);
    }

    // --- Immersive Mode ---

    private enableFocusMode() {
        // Dimming REMOVED per user request
        // document.body.classList.add('search-focused');
        // if (this.backdrop) this.backdrop.classList.remove('hidden');

        // Show suggestions immediately if valid
        if (this.searchInput?.value.trim()) {
            this.updateDropdown(this.searchInput.value);
        } else {
            this.showHistorySuggestions();
        }
    }

    private disableFocusMode() {
        // Dimming REMOVED per user request
        // document.body.classList.remove('search-focused');
        // if (this.backdrop) this.backdrop.classList.add('hidden');

        // Hide any popup
        this.removeDropdown();
    }

    private removeDropdown() {
        const historyPopup = document.getElementById('searchHistoryPopup');
        if (historyPopup) historyPopup.remove();

        const dropdown = document.getElementById('searchDropdown');
        if (dropdown) dropdown.remove();
    }

    private showHistorySuggestions() {
        this.removeDropdown(); // Clear others

        // Create or get popup
        let popup = document.createElement('div');
        popup.id = 'searchHistoryPopup';
        popup.className = 'search-history-popup fade-in';
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) searchContainer.appendChild(popup);

        const history = SearchHistoryManager.get();
        if (history.length === 0) {
            // No history = don't show popup at all
            popup.remove();
            return;
        }

        // Render chips
        popup.innerHTML = `
            <div class="history-popup-header">
                <span class="history-title">Tidigare / سابقاً</span>
                <button class="clear-history-btn" onclick="window.app.clearHistory()">Rensa / مسح</button>
            </div>
            <div class="history-chips-grid">
                ${history.map(term => `
                    <button class="history-chip-item" onclick="window.app.performSearch('${term}'); document.getElementById('searchInput').value = '${term}';">
                        <span class="history-icon">🕒</span>
                        <span class="history-text">${term}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    // --- Rich Autocomplete ---

    private updateDropdown(query: string) {
        if (!query.trim()) {
            this.showHistorySuggestions();
            return;
        }

        const matches = this.getAutocompleteMatches(query);
        if (matches.length === 0) {
            this.removeDropdown();
            return;
        }

        this.renderDropdown(matches, query);
    }

    private getAutocompleteMatches(query: string): { row: any[], index: number }[] {
        const normalizedQuery = query.toLowerCase().trim();
        const matches: number[] = [];

        // Fast prefix match limit to 5
        // Ideally we prioritize exact > start > contains
        // For autocomplete, 'start' is most important.

        // 1. StartsWith (Primary)
        for (let i = 0; i < this.searchIndex.length; i++) {
            if (matches.length >= 5) break;
            if (this.searchIndex[i].startsWith(normalizedQuery)) {
                matches.push(i);
            }
        }

        // 2. If not enough, try Arabic startsWith
        if (matches.length < 5) {
            const normalizedArb = normalizeArabic(normalizedQuery);
            for (let i = 0; i < this.searchIndexArabic.length; i++) {
                if (matches.length >= 5) break;
                if (!matches.includes(i) && this.searchIndexArabic[i].startsWith(normalizedArb)) {
                    matches.push(i);
                }
            }
        }

        // 3. Fuzzy Search (Fallback)
        // If we have few matches and query is meaningful (>= 3 chars)
        if (matches.length < 5 && normalizedQuery.length >= 3) {
            // Allow more fuzziness for longer words (e.g. 'tyckaon' -> 'tycka om')
            const maxDist = normalizedQuery.length > 6 ? 3 : 2;
            const fuzzyCandidates: { index: number, dist: number }[] = [];

            // Optimization: Track existing matches to avoid duplicates
            const existing = new Set(matches);

            for (let i = 0; i < this.searchIndex.length; i++) {
                if (existing.has(i)) continue;

                const swe = this.searchIndex[i];
                // Fast Length Check
                if (Math.abs(swe.length - normalizedQuery.length) > maxDist) continue;

                const dist = levenshteinDistance(swe, normalizedQuery);
                if (dist <= maxDist) {
                    fuzzyCandidates.push({ index: i, dist });
                }
            }

            // Sort by distance and take what we need
            fuzzyCandidates.sort((a, b) => a.dist - b.dist);

            for (const candidate of fuzzyCandidates) {
                if (matches.length >= 5) break;
                matches.push(candidate.index);
            }
        }

        // Return rows with original index for cache lookup
        return matches.map(i => ({ row: this.data[i], index: i }));
    }

    private renderDropdown(results: { row: any[], index: number }[], query: string) {
        this.removeDropdown();

        const dropdown = document.createElement('div');
        dropdown.id = 'searchDropdown';
        dropdown.className = 'search-dropdown';

        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) searchContainer.appendChild(dropdown);

        results.forEach((itemObj) => {
            const { row, index } = itemObj;
            const word = row[2];
            const arabic = row[3] || '';
            const typeCat = this.typeCategoryCache.get(`${index}`) || 'default';

            const badgeLabel = this.getSimpleLabel(typeCat);

            const item = document.createElement('div');
            item.className = 'search-item';
            item.onclick = () => {
                const searchInput = document.getElementById('searchInput') as HTMLInputElement;
                if (searchInput) {
                    searchInput.value = word;
                    SearchHistoryManager.add(word); // Save to history on click
                    this.handleInput(word); // Trigger full search
                    this.disableFocusMode();
                }
            };

            // Highlight Logic
            const highlightedWord = this.highlightMatch(word, query);

            item.innerHTML = `
                <div class="item-main">
                    <span class="item-word-sv">${highlightedWord}</span>
                    ${badgeLabel ? `<span class="badge-mini type-${typeCat}">${badgeLabel}</span>` : ''}
                </div>
                <span class="item-word-ar">${arabic}</span>
            `;
            dropdown.appendChild(item);
        });
    }

    private getSimpleLabel(cat: string): string {
        const labels: Record<string, string> = {
            'noun': 'En/Ett', 'en': 'En', 'ett': 'Ett', 'verb': 'Verb', 'adjective': 'Adj',
            'adverb': 'Adv', 'preposition': 'Prep', 'conjunction': 'Konj', 'pronoun': 'Pron',
            'medical': 'Med', 'legal': 'Jur', 'tech': 'Tekn', 'default': ''
        };
        return labels[cat] || cat.substring(0, 3).toUpperCase();
    }

    private highlightMatch(text: string, query: string): string {
        const index = text.toLowerCase().indexOf(query.toLowerCase());
        if (index >= 0) {
            return text.substring(0, index) +
                `<span class="highlight-char">${text.substring(index, index + query.length)}</span>` +
                text.substring(index + query.length);
        }
        return text;
    }

    // --- Search Logic (Ported from App.ts) ---

    public getSearchResults(query: string, data: any[][]): any[] {
        if (!data || data.length === 0) return [];

        const normalizedQuery = query.toLowerCase().trim();
        const normalizedQueryArabic = normalizeArabic(normalizedQuery);

        // 1. Check Filters

        // Optimization: Single Pass Bucket Sort (O(N))
        const exactMatches: number[] = [];
        const startMatches: number[] = [];
        const partialMatches: number[] = [];

        const hasTopicFilter = this.activeFilterMode === 'all' && this.isTopicFilterActive();
        const hasTypeFilter = this.activeTypeFilter !== 'all';
        const topicFilter = hasTopicFilter ? (document.getElementById('categorySelect') as HTMLSelectElement)?.value : '';

        // If no query and filtering by favorites
        if (!normalizedQuery && this.activeFilterMode === 'favorites') {
            return data.filter((_, i) => FavoritesManager.has(data[i][0].toString()));
        }
        // If just browsing all
        if (!normalizedQuery && !hasTopicFilter && !hasTypeFilter && this.activeFilterMode === 'all') {
            return []; // Signal to show landing page
        }

        for (let i = 0; i < this.searchIndex.length; i++) {
            const swe = this.searchIndex[i];
            const arb = this.searchIndexArabic[i];

            // A. Type Filter
            if (hasTypeFilter) {
                const cat = this.typeCategoryCache.get(`${i}`);
                if (cat !== this.activeTypeFilter) continue;
            }

            // B. Topic Filter
            if (hasTopicFilter) {
                const tags = (data[i][11] || '').toLowerCase();
                if (!tags.includes(topicFilter)) continue;
            }

            // C. Favorites Filter
            if (this.activeFilterMode === 'favorites') {
                if (!FavoritesManager.has(data[i][0].toString())) continue;
            }

            // D. Query Matching
            let isExact = false;
            let isStart = false;
            let isPartial = false;

            if (this.activeFilterMode === 'start') {
                if (!swe.startsWith(normalizedQuery) && !arb.startsWith(normalizedQueryArabic)) continue;
                isStart = true;
            } else if (this.activeFilterMode === 'end') {
                if (!swe.endsWith(normalizedQuery) && !arb.endsWith(normalizedQueryArabic)) continue;
                isPartial = true;
            } else if (this.activeFilterMode === 'exact') {
                if (swe !== normalizedQuery && arb !== normalizedQueryArabic) continue;
                isExact = true;
            } else if (this.activeFilterMode === 'synonym') {
                const def = (data[i][5] || '').toLowerCase();
                if (!def.includes(normalizedQuery)) continue;
                isPartial = true;
            } else if (this.activeFilterMode === 'learning') {
                if (!this.trainingIds.has(data[i][0].toString())) continue;
                // fall through to matching
            }

            // Standard Match
            if (normalizedQuery) {
                if (swe === normalizedQuery || arb === normalizedQueryArabic) isExact = true;
                else if (swe.startsWith(normalizedQuery) || arb.startsWith(normalizedQueryArabic)) isStart = true;
                else if (swe.includes(normalizedQuery) || arb.includes(normalizedQueryArabic)) isPartial = true;
                /* Note: We don't continue here to allow fuzzy check later? 
                   No, separate loop is better for performance (conditionally run). 
                   So we continue if no match found here, UNLESS we want to mark it for fuzzy?
                   Fuzzy is expensive, so separate loop only if needed. */
                else continue;
            } else {
                isPartial = true; // No query but passed filters
            }

            if (isExact) exactMatches.push(i);
            else if (isStart) startMatches.push(i);
            else if (isPartial) partialMatches.push(i);
        }

        // E. Fuzzy Search (Only if few matches and query is long enough)
        const fuzzyMatches: { index: number, dist: number }[] = [];
        const totalStandardMatches = exactMatches.length + startMatches.length + partialMatches.length;

        if (totalStandardMatches < 5 && normalizedQuery.length >= 3 && this.activeFilterMode === 'all') {
            const maxDist = normalizedQuery.length > 6 ? 3 : 2;

            // Optimization: We need to check duplicates against standard matches
            const standardMatchSet = new Set([...exactMatches, ...startMatches, ...partialMatches]);

            for (let i = 0; i < this.searchIndex.length; i++) {
                // Skip if already found
                if (standardMatchSet.has(i)) continue;

                // A. Apply Filters (Must re-apply here)
                if (hasTypeFilter) {
                    const cat = this.typeCategoryCache.get(`${i}`);
                    if (cat !== this.activeTypeFilter) continue;
                }
                if (hasTopicFilter) {
                    const tags = (data[i][11] || '').toLowerCase();
                    if (!tags.includes(topicFilter)) continue;
                }

                const swe = this.searchIndex[i];
                // Length check optimization (abs diff > maxDist means Levenshtein > maxDist)
                if (Math.abs(swe.length - normalizedQuery.length) > maxDist) continue;

                const dist = levenshteinDistance(swe, normalizedQuery);
                if (dist <= maxDist) {
                    fuzzyMatches.push({ index: i, dist });
                }
            }

            // Sort fuzzy matches by distance
            fuzzyMatches.sort((a, b) => a.dist - b.dist);
        }

        let filteredIndices = [
            ...exactMatches,
            ...startMatches,
            ...partialMatches,
            ...fuzzyMatches.map(f => f.index)
        ];

        // Sort Override
        if (this.activeSortMethod === 'az') {
            filteredIndices.sort((a, b) => this.searchIndex[a].localeCompare(this.searchIndex[b], 'sv'));
        } else if (this.activeSortMethod === 'za') {
            filteredIndices.sort((a, b) => this.searchIndex[b].localeCompare(this.searchIndex[a], 'sv'));
        }

        return filteredIndices.map(idx => data[idx]);
    }

    private performSearch(query: string) {
        // Just trigger App's search for now to keep it safe?
        // Or better: pass a callback "onResultsFound"
        if ((window as any).app) {
            (window as any).app.performSearch(query);
        }
    }

    private isTopicFilterActive(): boolean {
        const categorySelect = document.getElementById('categorySelect') as HTMLSelectElement | null;
        return !!(categorySelect && categorySelect.value !== 'all');
    }
}
