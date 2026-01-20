import { Loader } from './loader';
import './utils';
import './quiz';
import './confetti';
import { ThemeManager, showToast, TextSizeManager, VoiceSearchManager, normalizeArabic, levenshteinDistance } from './utils';
import { FavoritesManager } from './favorites';
import { SearchHistoryManager } from './search-history';
import { QuizStats } from './quiz-stats';
import { initMainUI } from './main-ui';
import { LanguageManager, t } from './i18n';
import './i18n-apply';
import { TypeColorSystem } from './type-color-system';
import { debounce } from './performance-utils';

/**
 * Main SnabbaLexin Application
 */

export class App {
    private isLoading = true;
    private searchIndex: string[] = [];
    private searchIndexArabic: string[] = []; // Pre-normalized Arabic index
    private currentResults: any[][] = [];
    private readonly BATCH_SIZE = 20;
    private renderedCount = 0;
    // Filter states
    private activeFilterMode = 'all';
    private activeTypeFilter = 'all';
    private activeSortMethod = 'relevance';
    // Performance: Cache for type categories
    private typeCategoryCache: Map<string, string> = new Map();
    // Performance: Debounced search handler
    private debouncedSearch: (query: string) => void;
    // Performance: Flag to track if type counts need update
    private typeCountsNeedUpdate = true;

    constructor() {
        // Initialize debounced search (150ms delay for responsive feel)
        this.debouncedSearch = debounce((query: string) => {
            this.performSearchInternal(query);
        }, 150);
        this.init();
    }

    private async init() {
        // Initialize language first to apply correct classes
        LanguageManager.init();

        initMainUI();
        Loader.checkCacheAndLoad();
        this.initStreaks();
        this.setupSearchListeners();
        this.setupThemeListener();
        this.initQuickActions();
        this.setupInfiniteScroll();
        this.setupGlobalHandlers();
        this.setupFilters();
        this.setupVoiceSearch();
        this.setupVoiceSelection();
        this.setupKeyboardShortcuts();
        this.updateDailyChallenge(); // Initial update
        this.updateDailyProgressBar(); // Update daily progress bar

        // Initial search from URL parameter 's'
        const params = new URLSearchParams(window.location.search);
        const searchQuery = params.get('s');
        if (searchQuery) {
            const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
            if (searchInput) searchInput.value = searchQuery;
        }

        window.addEventListener('dictionaryLoaded', () => {
            console.log('[App] Data loaded event received');
            this.handleDataLoaded();
        });

        // Fallback for immediate data availability
        if ((window as any).dictionaryData && (window as any).dictionaryData.length > 0) {
            this.handleDataLoaded();
        }

        // BFCache support (Back button restoration)
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                console.log('[App] Restoring from BFCache');
                // Re-read URL params and trigger search restoration if data is ready
                if ((window as any).dictionaryData && (window as any).dictionaryData.length > 0) {
                    const params = new URLSearchParams(window.location.search);
                    const s = params.get('s');
                    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
                    if (s && searchInput) {
                        searchInput.value = s;
                        this.performSearch(s);
                    }
                }
            }
        });
    }

    private initStreaks() {
        const lastVisitKey = 'lastVisitDate';
        const streakKey = 'dailyStreak';
        const today = new Date().toISOString().split('T')[0];
        const lastVisit = localStorage.getItem(lastVisitKey);
        let streak = parseInt(localStorage.getItem(streakKey) || '0');

        if (lastVisit !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            if (lastVisit === yesterdayStr) streak++;
            else streak = 1;

            localStorage.setItem(lastVisitKey, today);
            localStorage.setItem(streakKey, streak.toString());
        }

        const streakEl = document.getElementById('currentStreak');
        if (streakEl) {
            streakEl.innerHTML = streak.toString();
        }
    }

    private setupThemeListener() {
        const themeBtn = document.getElementById('themeToggle');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                ThemeManager.toggle();
            });
        }
    }

    private setupSearchListeners() {
        const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => this.handleSearch(e));

        // Save to history only on Enter key
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    SearchHistoryManager.add(query);
                }
            }
        });

        const clearSearch = document.getElementById('clearSearch');

        const toggleClearBtn = () => {
            if (clearSearch) {
                if (searchInput.value.length > 0) {
                    clearSearch.classList.remove('hidden');
                    clearSearch.style.display = 'flex'; // Ensure flex layout if needed
                } else {
                    clearSearch.classList.add('hidden');
                    clearSearch.style.display = ''; // Reset inline style
                }
            }
        };

        searchInput.addEventListener('input', () => {
            toggleClearBtn();
        });

        // Initialize button state with a slight delay to catch browser autofill/restoration
        setTimeout(() => {
            toggleClearBtn();
        }, 100);

        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                searchInput.value = '';
                clearSearch.classList.add('hidden');
                clearSearch.style.display = '';
                this.performSearch('');
            });
        }
    }

    private setupFilters() {
        const modeSelect = document.getElementById('filterModeSelect') as HTMLSelectElement | null;
        const typeSelect = document.getElementById('typeSelect') as HTMLSelectElement | null;
        const sortSelect = document.getElementById('sortSelect') as HTMLSelectElement | null;

        const quickFavBtn = document.getElementById('quickFavBtn');

        const updateFilters = () => {
            if (modeSelect) this.activeFilterMode = modeSelect.value;
            if (typeSelect) this.activeTypeFilter = typeSelect.value;
            if (sortSelect) this.activeSortMethod = sortSelect.value;

            const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
            this.performSearch(searchInput?.value || '');
        };

        if (modeSelect) modeSelect.addEventListener('change', updateFilters);
        if (typeSelect) typeSelect.addEventListener('change', updateFilters);
        if (sortSelect) sortSelect.addEventListener('change', updateFilters);


        if (quickFavBtn) {
            quickFavBtn.addEventListener('click', () => {
                if (modeSelect) {
                    modeSelect.value = modeSelect.value === 'favorites' ? 'all' : 'favorites';
                    updateFilters();
                }
            });
        }

        const filterToggleBtn = document.getElementById('filterToggleBtn');
        const filterContainer = document.getElementById('filterChipsContainer');
        if (filterToggleBtn && filterContainer) {
            filterToggleBtn.addEventListener('click', () => {
                filterContainer.classList.toggle('hidden');
                filterToggleBtn.classList.toggle('active');
            });
        }
    }

    private setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // '/' to focus search
            if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) searchInput.focus();
            }
        });

        // Desktop Autofocus (if not mobile)
        if (window.innerWidth > 768 && !('ontouchstart' in window)) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) setTimeout(() => searchInput.focus(), 100);
        }
    }

    private trainingIds: Set<string> = new Set(); // Cache for training words

    private async handleDataLoaded() {
        if (!this.isLoading) return;
        this.isLoading = false;
        console.log('[App] Data loaded, initializing...');

        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';

        const data = (window as any).dictionaryData as any[][];
        if (!data) return;

        // Initialize DB and load training words
        try {
            const { DictionaryDB } = await import('./db');
            await DictionaryDB.init();
            const trainingWords = await DictionaryDB.getTrainingWords();
            this.trainingIds = new Set(trainingWords.filter(w => w.needsTraining).map(w => w.id));
            console.log('[App] Loaded training words:', this.trainingIds.size);
        } catch (e) {
            console.error('[App] Failed to load training words:', e);
        }

        // PERFORMANCE: Build optimized search indices
        console.time('[Perf] Building search index');
        this.searchIndex = data.map(row => row[2].toLowerCase());
        this.searchIndexArabic = data.map(row => normalizeArabic(row[3] || '').toLowerCase());

        // PERFORMANCE: Pre-cache type categories for all words
        this.typeCategoryCache.clear();
        data.forEach((row, index) => {
            const cacheKey = `${index}`;
            const cat = TypeColorSystem.getCategory(row[1], row[2], row[6], row[13] || '', row[3] || '');
            this.typeCategoryCache.set(cacheKey, cat);
        });
        console.timeEnd('[Perf] Building search index');

        // Initialize Word of the Day
        this.initWordOfTheDay();

        // STRICT Persistence Check: URL First, then sessionStorage, then Input
        const params = new URLSearchParams(window.location.search);
        const urlQuery = params.get('s');
        const sessionQuery = sessionStorage.getItem('snabbaLexin_lastSearch');
        const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;

        // Priority: URL > sessionStorage > Input Field
        const queryToRestore = urlQuery || sessionQuery || (searchInput?.value.trim() || '');

        console.log('[Debug] Persistence | URL:', urlQuery, '| Session:', sessionQuery, '| Input:', searchInput?.value, '| Using:', queryToRestore);

        if (queryToRestore) {
            console.log('[Debug] Restoring search:', queryToRestore);
            if (searchInput) {
                searchInput.value = queryToRestore;
            }
            // Sync URL if it came from session
            if (!urlQuery && sessionQuery && window.history.replaceState) {
                const newUrl = `${window.location.pathname}?s=${encodeURIComponent(sessionQuery)}`;
                window.history.replaceState({ path: newUrl }, '', newUrl);
            }
            this.performSearch(queryToRestore);
        } else {
            console.log('[Debug] No search state found, showing landing page.');
            this.performSearch('');
        }

        this.updateDailyChallenge();

        // Update Filter Counts
        this.updateTypeCounts(data);
    }

    private updateTypeCounts(data: any[][]) {
        console.time('[Perf] updateTypeCounts');
        const counts: Record<string, number> = {};
        const fullData = (window as any).dictionaryData as any[][];

        data.forEach((row) => {
            // PERFORMANCE: Use cached category if available
            // Find the original index in fullData to use cache
            const originalIdx = fullData.indexOf(row);
            let cat: string;

            if (originalIdx !== -1 && this.typeCategoryCache.has(`${originalIdx}`)) {
                cat = this.typeCategoryCache.get(`${originalIdx}`)!;
            } else {
                cat = TypeColorSystem.getCategory(row[1], row[2], row[6], row[13] || '', row[3] || '');
            }

            let key = cat;
            if (cat === 'noun') key = 'subst';
            if (cat === 'conj') key = 'konj';
            if (cat === 'pronoun') key = 'pron';
            if (cat === 'phrase' || cat === 'phrasal') key = 'fras';

            // Explicit Mappings for missing types
            if (cat === 'prep') key = 'prep';
            if (cat === 'adj') key = 'adj';
            if (cat === 'adv') key = 'adv';

            // Fallbacks for types not fully covered by getCategory string
            const typeLower = (row[1] || '').toLowerCase();
            if (typeLower.includes('interj')) key = 'interj';
            if (typeLower.includes('räkne') || typeLower.includes('num')) key = 'num';

            counts[key] = (counts[key] || 0) + 1;

            // Specialized Topics (Simple keyword check in Type column)
            if (typeLower.includes('juridik')) counts['juridik'] = (counts['juridik'] || 0) + 1;
            if (typeLower.includes('medicin')) counts['medicin'] = (counts['medicin'] || 0) + 1;

            if (typeLower.includes('data') || typeLower.includes('dator') || typeLower.includes('it') || typeLower.includes('teknik')) {
                counts['it'] = (counts['it'] || 0) + 1;
            }
            if (typeLower.includes('politik') || typeLower.includes('samhäll')) {
                counts['politik'] = (counts['politik'] || 0) + 1;
            }
            if (typeLower.includes('religion') || typeLower.includes('islam') || typeLower.includes('krist') || typeLower.includes('bibel') || typeLower.includes('koran')) {
                counts['religion'] = (counts['religion'] || 0) + 1;
            }
        });

        const select = document.getElementById('typeSelect') as HTMLSelectElement;
        if (!select) return;

        Array.from(select.querySelectorAll('option')).forEach(opt => {
            const val = opt.value;
            if (val === 'all') {
                opt.textContent = `Alla (${data.length})`;
                return;
            }
            if (counts[val]) {
                const baseText = opt.textContent?.split(' (')[0].trim();
                opt.textContent = `${baseText} (${counts[val]})`;
            }
        });
        console.timeEnd('[Perf] updateTypeCounts');
    }

    private initWordOfTheDay() {
        const data = (window as any).dictionaryData as any[][];
        if (!data || data.length === 0) return;

        let word = null;
        let attempts = 0;
        while (attempts < 500) {
            const idx = Math.floor(Math.random() * data.length);
            const w = data[idx];
            const hasIdiom = (w[9] && w[9].length > 0) || (w[10] && w[10].length > 0);
            const hasExample = w[7] && w[7].split(' ').length > 5;

            if (hasIdiom || hasExample) {
                word = w;
                break;
            }
            attempts++;
        }
        if (!word) word = data[Math.floor(Math.random() * data.length)];

        QuizStats.recordStudy(word[0].toString());

        this.renderWod(word);
    }

    private renderWod(word: any[]) {
        const wodCard = document.getElementById('wordOfTheDay');
        if (!wodCard) return;

        wodCard.classList.remove('hidden');

        const swe = wodCard.querySelector('.wod-swe');
        const arb = wodCard.querySelector('.wod-arb');
        const typeBadge = wodCard.querySelector('.wod-type-badge');

        if (swe) {
            swe.textContent = word[2];
            TextSizeManager.apply(swe as HTMLElement, word[2]);
        }
        if (arb) {
            arb.textContent = word[3];
            TextSizeManager.apply(arb as HTMLElement, word[3]);
        }
        if (typeBadge) typeBadge.textContent = word[1];

        const sectionsToHide = [
            '.wod-forms-preview',
            '.wod-def-preview',
            '.wod-example-preview',
            '.wod-example-arb-preview',
            '.wod-idiom-preview'
        ];

        sectionsToHide.forEach(selector => {
            const el = wodCard.querySelector(selector) as HTMLElement;
            if (el) el.classList.add('hidden');
        });

        const ttsBtn = document.getElementById('wodTTSBtn');
        if (ttsBtn) {
            ttsBtn.onclick = () => (window as any).TTSManager?.speak(word[2], 'sv');
        }

        const detailsBtn = document.getElementById('wodDetailsBtn');
        if (detailsBtn) {
            detailsBtn.onclick = () => window.location.href = `details.html?id=${word[0]}`;
        }

        const loopBtn = document.getElementById('wodLoopBtn');
        if (loopBtn) {
            loopBtn.onclick = () => this.initWordOfTheDay();
        }

        const favBtn = document.getElementById('wodFavBtn');
        if (favBtn) {
            const wordId = word[0].toString();
            const isFav = FavoritesManager.has(wordId);
            FavoritesManager.updateButtonIcon(favBtn, isFav);
            favBtn.onclick = () => {
                const nowFav = FavoritesManager.toggle(wordId);
                FavoritesManager.updateButtonIcon(favBtn, nowFav);
            };
        }
    }

    private initQuickActions() {
        const quickWodBtn = document.getElementById('quickWodBtn');
        if (quickWodBtn) {
            quickWodBtn.addEventListener('click', () => {
                const wodCard = document.getElementById('wordOfTheDay');
                if (wodCard) {
                    wodCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    wodCard.classList.add('pulse-animation');
                    setTimeout(() => wodCard.classList.remove('pulse-animation'), 500);
                }
            });
        }
    }

    private handleSearch(e: Event) {
        const input = e.target as HTMLInputElement;
        const query = input.value.trim();

        if (window.history.replaceState) {
            const newUrl = query
                ? `${window.location.pathname}?s=${encodeURIComponent(query)}`
                : window.location.pathname;
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }
        sessionStorage.setItem('snabbaLexin_lastSearch', query);

        this.debouncedSearch(input.value);
    }

    public performSearch(query: string) {
        this.performSearchInternal(query);
    }

    private performSearchInternal(query: string) {
        console.time('[Perf] performSearch');
        const normalizedQuery = query.toLowerCase().trim();
        const normalizedQueryArabic = normalizeArabic(normalizedQuery);

        if (window.history.replaceState) {
            const newUrl = normalizedQuery
                ? `${window.location.pathname}?s=${encodeURIComponent(normalizedQuery)}`
                : window.location.pathname;
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }

        const data = (window as any).dictionaryData || [];
        if (!data || data.length === 0) return;

        const landingPage = document.getElementById('landingPageContent');
        const searchResults = document.getElementById('searchResults');
        const emptyState = document.getElementById('emptyState');

        this.renderedCount = 0; // Reset pagination

        let filteredIndices: number[] = [];

        if (this.activeFilterMode === 'favorites') {
            for (let i = 0; i < data.length; i++) {
                if (FavoritesManager.has(data[i][0].toString())) {
                    filteredIndices.push(i);
                }
            }
        } else {
            filteredIndices = Array.from({ length: data.length }, (_, i) => i);
        }

        if (normalizedQuery) {
            filteredIndices = filteredIndices.filter((idx) => {
                const swe = this.searchIndex[idx];
                const arb = this.searchIndexArabic[idx];

                if (this.activeFilterMode === 'start') {
                    return swe.startsWith(normalizedQuery) || arb.startsWith(normalizedQueryArabic);
                }
                if (this.activeFilterMode === 'end') {
                    return swe.endsWith(normalizedQuery) || arb.endsWith(normalizedQueryArabic);
                }
                if (this.activeFilterMode === 'exact') {
                    return swe === normalizedQuery || arb === normalizedQueryArabic;
                }
                return swe.includes(normalizedQuery) || arb.includes(normalizedQueryArabic);
            });
        }

        if (this.typeCountsNeedUpdate) {
            const filteredData = filteredIndices.map(i => data[i]);
            this.updateTypeCounts(filteredData);
            this.typeCountsNeedUpdate = false;
        }

        if (this.activeTypeFilter !== 'all') {
            filteredIndices = filteredIndices.filter((idx) => {
                const cachedCat = this.typeCategoryCache.get(`${idx}`);
                return cachedCat === this.activeTypeFilter;
            });
        }

        const categorySelect = document.getElementById('categorySelect') as HTMLSelectElement | null;
        if (categorySelect && categorySelect.value !== 'all') {
            const topic = categorySelect.value;
            filteredIndices = filteredIndices.filter((idx) => {
                const tags = (data[idx][11] || '').toLowerCase();
                return tags.includes(topic);
            });
        }

        if (this.activeSortMethod === 'az' || this.activeSortMethod === 'alpha_asc') {
            filteredIndices.sort((a, b) => this.searchIndex[a].localeCompare(this.searchIndex[b], 'sv'));
        } else if (this.activeSortMethod === 'za' || this.activeSortMethod === 'alpha_desc') {
            filteredIndices.sort((a, b) => this.searchIndex[b].localeCompare(this.searchIndex[a], 'sv'));
        } else if (this.activeSortMethod === 'richness') {
            filteredIndices.sort((a, b) => {
                const aLen = (data[a][5] || '').length + (data[a][7] || '').length;
                const bLen = (data[b][5] || '').length + (data[b][7] || '').length;
                return bLen - aLen;
            });
        } else if (normalizedQuery) {
            filteredIndices.sort((a, b) => {
                const aSwe = this.searchIndex[a];
                const bSwe = this.searchIndex[b];
                const aArb = this.searchIndexArabic[a];
                const bArb = this.searchIndexArabic[b];

                const aExact = (aSwe === normalizedQuery || aArb === normalizedQueryArabic);
                const bExact = (bSwe === normalizedQuery || bArb === normalizedQueryArabic);

                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;

                const aStarts = (aSwe.startsWith(normalizedQuery) || aArb.startsWith(normalizedQueryArabic));
                const bStarts = (bSwe.startsWith(normalizedQuery) || bArb.startsWith(normalizedQueryArabic));

                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;

                return 0;
            });
        }

        const filtered = filteredIndices.map(idx => data[idx]);
        this.currentResults = filtered;

        const showLanding = !normalizedQuery && this.activeFilterMode === 'all';

        if (showLanding) {
            if (landingPage) landingPage.style.display = 'block';
            if (searchResults) {
                searchResults.style.display = 'none';
                searchResults.innerHTML = '';
            }
            if (emptyState) emptyState.style.display = 'block';

            this.renderSearchHistory();
        } else {
            if (landingPage) landingPage.style.display = 'none';
            if (searchResults) {
                searchResults.style.display = 'grid';
                searchResults.innerHTML = '';
            }
            if (emptyState) {
                emptyState.style.display = filtered.length === 0 ? 'block' : 'none';
                if (filtered.length === 0 && normalizedQuery.length > 2) {
                    this.showDidYouMean(normalizedQuery, emptyState);
                } else {
                    const suggestionBox = emptyState.querySelector('.suggestion-box');
                    if (suggestionBox) suggestionBox.remove();
                }
            }
            this.renderNextBatch();
        }

        this.updateResultCount();
        console.timeEnd('[Perf] performSearch');
    }

    private renderNextBatch() {
        if (this.renderedCount >= this.currentResults.length) return;

        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        const nextBatch = this.currentResults.slice(this.renderedCount, this.renderedCount + this.BATCH_SIZE);
        const html = nextBatch.map(row => this.createCard(row)).join('');

        searchResults.insertAdjacentHTML('beforeend', html);
        this.renderedCount += nextBatch.length;

        TextSizeManager.autoApply();
    }

    private createCard(row: any[]): string {
        const id = row[0];
        const swe = row[2];
        const arb = row[3];
        const type = row[1];
        const forms = row[6] || '';
        const gender = row[13] || '';

        const grammarBadge = TypeColorSystem.generateBadge(type, swe, forms, gender, arb);
        const dataType = TypeColorSystem.getDataType(type, swe, forms, gender, arb);
        const isFav = FavoritesManager.has(id.toString());
        const isTraining = this.trainingIds.has(id.toString()); // Use class state

        const starIcon = isFav
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;

        const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;

        const speakerIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;

        const formsHtml = forms ? `<div class="ghost-forms">${forms}</div>` : '';
        const mockMastery = (parseInt(id) % 4) * 33;

        return `
            <div class="card card-link compact-card" data-type="${dataType}" onclick="if(!event.target.closest('button')) window.location.href='details.html?id=${id}'">
                <div class="card-top-row">
                    ${grammarBadge}
                    <div class="card-actions">
                        <button class="action-button audio-btn" onclick="speakText('${swe.replace(/'/g, "\\'")}', 'sv'); event.stopPropagation();" title="Lyssna">
                            ${speakerIcon}
                        </button>
                        <button class="copy-btn action-button" onclick="copyWord('${swe.replace(/'/g, "\\'")}', event)" title="Kopiera">
                            ${copyIcon}
                        </button>
                        <!-- Training Button -->
                        <button class="action-button train-btn ${isTraining ? 'active' : ''}" 
                                onclick="toggleTraining('${id}', this, event)" 
                                title="${isTraining ? 'Ta bort från träning' : 'Lägg till i träning'}"
                                data-id="${id}">
                            ${isTraining ? '🧠' : '💪'}
                        </button>
                        <button class="fav-btn action-button ${isFav ? 'active' : ''}" onclick="toggleFavorite('${id}', this, event)" title="Spara">
                            ${starIcon}
                        </button>
                    </div>
                </div>
                <div class="card-main-content">
                    <h2 class="word-swe" dir="ltr" data-auto-size data-max-lines="1">${swe}</h2>
                    ${formsHtml}
                    <p class="word-arb" dir="rtl" data-auto-size data-max-lines="1">${arb}</p>
                </div>
                <!-- <div class="mastery-bar-container"><div class="mastery-fill" style="width: ${mockMastery}%"></div></div> -->
            </div>
        `;
    }

    private showDidYouMean(query: string, container: HTMLElement) {
        const bestMatch = this.findDetailedSuggestion(query);

        const existing = container.querySelector('.suggestion-box');
        if (existing) existing.remove();

        if (bestMatch) {
            const html = `
                <div class="suggestion-box" style="margin-top: 1rem; text-align: center;">
                    <p style="color: var(--text-muted); font-size: 0.9rem;">
                        <span class="sv-text">Menade du:</span>
                        <span class="ar-text">هل تقصد:</span>
                        <button class="suggestion-link" onclick="window.app.performSearch('${bestMatch.replace(/'/g, "\\'")}')" style="
                            background: none; 
                            border: none; 
                            color: var(--primary); 
                            text-decoration: underline; 
                            cursor: pointer; 
                            font-weight: bold;
                            font-size: 1rem;
                            margin: 0 5px;
                        ">${bestMatch}</button>?
                    </p>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', html);
        }
    }

    private findDetailedSuggestion(query: string): string | null {
        const candidates = this.searchIndex;

        let bestWord = null;
        let minDist = 3;

        for (let i = 0; i < candidates.length; i++) {
            const word = candidates[i];
            if (Math.abs(word.length - query.length) > 2) continue;

            const dist = levenshteinDistance(query, word);
            if (dist < minDist) {
                minDist = dist;
                bestWord = word;
            }
            if (dist === 0) return word;
        }

        return bestWord;
    }

    private setupInfiniteScroll() {
        window.addEventListener('scroll', () => {
            if (this.currentResults.length === 0) return;
            const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
            if (scrollTop + clientHeight >= scrollHeight - 300) {
                this.renderNextBatch();
            }
        });
    }

    private setupGlobalHandlers() {
        (window as any).copyWord = (word: string, e: Event) => {
            e.stopPropagation();
            navigator.clipboard.writeText(word).then(() => showToast(t('toast.copied') + ' 📋'));
        };

        (window as any).toggleFavorite = (id: string, btn: HTMLElement, e: Event) => {
            e.stopPropagation();
            const sid = id.toString();
            const isFav = FavoritesManager.toggle(sid);
            btn.classList.toggle('active', isFav);
            btn.innerHTML = isFav
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
        };

        (window as any).toggleTraining = async (id: string, btn: HTMLElement, e: Event) => {
            e.stopPropagation();
            const sid = id.toString();

            // Toggle local state
            const isNowTraining = !this.trainingIds.has(sid);
            if (isNowTraining) {
                this.trainingIds.add(sid);
                btn.classList.add('active');
                btn.textContent = '🧠';
                btn.title = 'Ta bort från träning';
            } else {
                this.trainingIds.delete(sid);
                btn.classList.remove('active');
                btn.textContent = '💪';
                btn.title = 'Lägg till i träning';
            }

            // Persist
            try {
                const { DictionaryDB } = await import('./db');
                await DictionaryDB.updateTrainingStatus(sid, isNowTraining);
            } catch (err) {
                console.error('Failed to update training status', err);
            }
        };
    }

    private updateResultCount() {
        const countEl = document.getElementById('resultCount');
        if (countEl) countEl.textContent = this.currentResults.length.toLocaleString();
    }

    public updateDailyChallenge() {
        const DAILY_GOAL = parseInt(localStorage.getItem('dailyGoal') || '10');
        const todayStats = QuizStats.getTodayStats();
        const totalActivity = todayStats.correct + (todayStats.studied || 0);
        const percent = Math.min(100, (totalActivity / DAILY_GOAL) * 100);

        // Update progress bar
        const progressBar = document.getElementById('challengeProgressBar');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
            if (totalActivity >= DAILY_GOAL) {
                progressBar.classList.add('completed');
            }
        }

        // Update progress text
        const progressText = document.getElementById('challengeProgressText');
        if (progressText) {
            progressText.textContent = `${totalActivity}/${DAILY_GOAL}`;
            if (totalActivity >= DAILY_GOAL) {
                progressText.classList.add('completed');
            }
        }

        // Update challenge card for completed state
        const card = document.getElementById('dailyChallengeCard');
        if (card && totalActivity >= DAILY_GOAL) {
            card.classList.add('completed');
        }

        console.log(`[App] Daily challenge: ${totalActivity}/${DAILY_GOAL} (${percent.toFixed(0)}%)`);

        // Ensure the general progress bar is also in sync
        this.updateDailyProgressBar();
    }

    public updateDailyProgressBar() {
        const DAILY_GOAL = parseInt(localStorage.getItem('dailyGoal') || '10');
        const todayStats = QuizStats.getTodayStats();
        const totalActivity = todayStats.correct + (todayStats.studied || 0);
        const percent = Math.min(100, (totalActivity / DAILY_GOAL) * 100);

        // Update the daily progress count
        const progressCount = document.getElementById('dailyProgressCount');
        if (progressCount) {
            progressCount.textContent = totalActivity.toString();
        }

        // Update header badge (📖 count)
        const dailyWordsCount = document.getElementById('dailyWordsCount');
        if (dailyWordsCount) {
            dailyWordsCount.textContent = totalActivity.toString();
        }

        // Update the progress bar fill
        const progressFill = document.getElementById('dailyProgressFill');
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
            if (totalActivity >= DAILY_GOAL) {
                progressFill.classList.add('completed');
            }
        }

        // Update progress ring in modal (if open)
        const ringValue = document.getElementById('progressRingValue');
        if (ringValue) {
            ringValue.textContent = totalActivity.toString();
        }

        const ringGoal = document.getElementById('progressRingGoal');
        if (ringGoal) {
            ringGoal.textContent = DAILY_GOAL.toString();
        }

        // Update progress ring circle (SVG)
        const ringCircle = document.querySelector('.progress-ring-circle') as SVGCircleElement;
        if (ringCircle) {
            const circumference = 314.159; // 2 * PI * r (r=50)
            const offset = circumference - (percent / 100) * circumference;
            ringCircle.style.strokeDashoffset = offset.toString();
        }

        console.log(`[App] Daily progress: ${totalActivity}/${DAILY_GOAL} (${percent.toFixed(0)}%)`);
    }

    private setupVoiceSearch() {
        const voiceSearchBtn = document.getElementById('voiceSearchBtn');
        const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
        if (!voiceSearchBtn || !searchInput) return;

        voiceSearchBtn.addEventListener('click', () => {
            VoiceSearchManager.toggle();
        });

        VoiceSearchManager.onResult = (transcript: string, isFinal: boolean) => {
            searchInput.value = transcript;
            if (isFinal) {
                this.performSearch(transcript);
                showToast(`🎤 "${transcript}"`);
            }
        };
    }

    private setupVoiceSelection() {
        const voiceBtns = document.querySelectorAll('.voice-selector-inline .voice-btn');
        const currentVoice = localStorage.getItem('ttsVoicePreference') || 'natural';

        voiceBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-voice') === currentVoice);

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const voice = btn.getAttribute('data-voice') as 'natural' | 'female' | 'male';

                voiceBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                localStorage.setItem('ttsVoicePreference', voice);
                showToast(`🗣️ ${t('settings.voiceChanged') || 'Rösttyp ändrad'}`);
            });
        });
    }

    private renderSearchHistory() {
        const historyContainer = document.getElementById('searchHistoryContainer');
        const historyList = document.getElementById('searchHistoryList');
        const clearBtn = document.getElementById('clearHistoryBtn');

        if (!historyContainer || !historyList) return;

        const history = SearchHistoryManager.get();
        if (history.length === 0) {
            historyContainer.classList.add('hidden');
            return;
        }

        historyContainer.classList.remove('hidden');
        historyList.innerHTML = history.map(q => `
            <button class="history-chip" onclick="window.location.href='?s=${encodeURIComponent(q)}'">
                <span class="history-icon">🕒</span>
                <span class="history-text">${q}</span>
            </button>
        `).join('');

        // Clear button
        if (clearBtn) {
            clearBtn.onclick = () => {
                SearchHistoryManager.clear();
                this.renderSearchHistory();
            };
        }
    }
}

// Instantiate app if in browser
if (typeof window !== 'undefined') {
    (window as any).app = new App();
}
