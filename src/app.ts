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
import { openReactSettingsModal } from './settings-modal-launcher';

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
    // Search highlighting
    private currentQuery: string = '';
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

        const isTestMode = new URLSearchParams(window.location.search).has('test_mode');
        if (isTestMode) {
            console.log('[App] Test mode active, skipping onboarding...');
        } else {
            this.setupVoiceSearch();
            this.setupVoiceSelection();
            this.setupKeyboardShortcuts();
            this.updateDailyChallenge(); // Initial update
            this.updateDailyProgressBar(); // Update daily progress bar
            this.updateTrainingBadge(); // Initial badge update
            this.updateFavoritesBadge(); // Initial favorites badge update

            // Subscribe to favorites changes
            FavoritesManager.onChange(() => {
                this.updateFavoritesBadge();
                // If currently viewing favorites, refresh the list to remove unliked items
                if (this.activeFilterMode === 'favorites') {
                    this.performSearch(this.currentQuery);
                }
            });
        }

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
            // getTrainingWords returns words that are in the training store (no needsTraining filter needed)
            this.trainingIds = new Set(trainingWords.map(w => Array.isArray(w) ? w[0]?.toString() : w.id?.toString()).filter(Boolean));
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

        const trainBtn = document.getElementById('wodTrainBtn');
        if (trainBtn) {
            const wordId = word[0].toString();
            const isTraining = this.trainingIds.has(wordId);

            // Set initial state
            trainBtn.classList.toggle('active', isTraining);
            trainBtn.textContent = isTraining ? '🧠' : '💪';
            trainBtn.title = isTraining ? 'Ta bort från träning' : 'Lägg till i träning';

            trainBtn.onclick = (e) => {
                (window as any).toggleTraining(wordId, trainBtn, e);
            };
        }
    }


    private initQuickActions() {
        // Settings Button (React Modal)
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openReactSettingsModal();
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
        this.currentQuery = normalizedQuery;

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

        // Optimization: Single Pass Bucket Sort (O(N))
        // Instead of filter() -> sort(), we act like a conveyor belt putting items into buckets immediately.
        // This avoids iterating multiple times and eliminates the expensive sort operation.
        const exactMatches: number[] = [];
        const startMatches: number[] = [];
        const partialMatches: number[] = [];
        const topicMatches: number[] = [];

        // Check if we have active filters that require the slow path
        const categorySelect = document.getElementById('categorySelect') as HTMLSelectElement | null;
        const hasTopicFilter = this.activeFilterMode === 'all' && categorySelect && categorySelect.value !== 'all';
        const hasTypeFilter = this.activeTypeFilter !== 'all';
        const topicFilter = hasTopicFilter && categorySelect ? categorySelect.value : '';

        // If no query and filtering by favorites
        if (!normalizedQuery && this.activeFilterMode === 'favorites') {
            const favIndices = data.map((_: any, i: number) => i).filter((i: number) => FavoritesManager.has(data[i][0].toString()));
            this.currentResults = favIndices.map((i: number) => data[i]);
            this.finalizeSearch(landingPage, searchResults, emptyState, normalizedQuery);
            return;
        }

        // If just browsing all (no query, no filters)
        if (!normalizedQuery && !hasTopicFilter && !hasTypeFilter && this.activeFilterMode === 'all') {
            // Show landing page
            if (landingPage) landingPage.style.display = 'block';
            if (searchResults) searchResults.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            this.renderSearchHistory();
            return;
        }

        const maxResults = 100; // Cap purely for performance ensuring we don't hold 10k items in memory if not needed (though pagination handles rendering)
        // Actually, let's keep all valid matches but stop searching if we have "enough" exact matches? No, user might want specific one later.
        // Let's stick to full scan but it's fast.

        for (let i = 0; i < this.searchIndex.length; i++) {
            const swe = this.searchIndex[i];
            const arb = this.searchIndexArabic[i]; // Normalized Arabic

            // 1. FILTERING
            // Apply Type Filter early
            if (hasTypeFilter) {
                // Use cache
                const cat = this.typeCategoryCache.get(`${i}`);
                if (cat !== this.activeTypeFilter) continue;
            }

            // Apply Topic Filter
            if (hasTopicFilter) {
                const tags = (data[i][11] || '').toLowerCase(); // Column 11 is tags/domain
                if (!tags.includes(topicFilter)) continue;
            }

            // Apply Favorites Filter (User Request)
            if (this.activeFilterMode === 'favorites') {
                if (!FavoritesManager.has(data[i][0].toString())) continue;
            }

            // Match Flags
            let isExact = false;
            let isStart = false;
            let isPartial = false;

            // Apply Special Query Matching based on Mode
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
                // Check definitions (col 5) or synonyms (col 4 if any)
                const def = (data[i][5] || '').toLowerCase();
                if (!def.includes(normalizedQuery)) continue;
                isPartial = true;
            } else if (this.activeFilterMode === 'learning') {
                // Check if in training
                if (!this.trainingIds.has(data[i][0].toString())) continue;
                // Proceed to query matching
            } else if (this.activeFilterMode === 'known') {
                // Implementation for 'known' / mastered words if available
                // For now, let's assume it checks a mastered set if we had one.
                // Or maybe invert training?
                // Let's rely on standard search if no specific known logic exists yet.
            }

            // Standard Query Matching (if not handled by special modes above)
            if (this.activeFilterMode === 'all' || this.activeFilterMode === 'favorites' || this.activeFilterMode === 'learning' || this.activeFilterMode === 'known' || this.activeFilterMode === 'review') {
                if (normalizedQuery) {
                    if (swe === normalizedQuery || arb === normalizedQueryArabic) {
                        isExact = true;
                    } else if (swe.startsWith(normalizedQuery) || arb.startsWith(normalizedQueryArabic)) {
                        isStart = true;
                    } else if (swe.includes(normalizedQuery) || arb.includes(normalizedQueryArabic)) {
                        isPartial = true;
                    } else {
                        continue; // No match
                    }
                } else {
                    // No query, but passed filters -> treat as partial
                    isPartial = true;
                }
            }

            // 2. BUCKETING
            if (isExact) exactMatches.push(i);
            else if (isStart) startMatches.push(i);
            else if (isPartial) partialMatches.push(i);
        }

        // 3. MERGE
        // Priority: Exact > StartsWith > Partial
        let filteredIndices = [...exactMatches, ...startMatches, ...partialMatches];

        // Apply Sorting override if specific sort is selected (rare)
        if (this.activeSortMethod !== 'relevance') {
            if (this.activeSortMethod === 'az') {
                filteredIndices.sort((a, b) => this.searchIndex[a].localeCompare(this.searchIndex[b], 'sv'));
            } else if (this.activeSortMethod === 'za') {
                filteredIndices.sort((a, b) => this.searchIndex[b].localeCompare(this.searchIndex[a], 'sv'));
            }
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


    private finalizeSearch(landingPage: HTMLElement | null, searchResults: HTMLElement | null, emptyState: HTMLElement | null, normalizedQuery: string) {
        if (landingPage) landingPage.style.display = 'none';
        if (searchResults) {
            searchResults.style.display = 'grid';
            searchResults.innerHTML = '';
        }
        if (emptyState) {
            const isEmpty = this.currentResults.length === 0;
            emptyState.style.display = isEmpty ? 'block' : 'none';
            if (isEmpty && normalizedQuery.length > 2) {
                this.showDidYouMean(normalizedQuery, emptyState);
            } else {
                const suggestionBox = emptyState.querySelector('.suggestion-box');
                if (suggestionBox) suggestionBox.remove();
            }
        }
        this.renderNextBatch();
        this.updateResultCount();
    }

    private renderSearchHistory() {
        const landingPage = document.getElementById('landingPageContent');
        if (!landingPage) return;

        // Ensure History Section exists
        let historySection = document.getElementById('searchHistorySection');
        if (!historySection) {
            historySection = document.createElement('div');
            historySection.id = 'searchHistorySection';
            historySection.className = 'landing-section fade-in-up';
            // Insert after Hero
            const hero = landingPage.querySelector('.hero-section');
            if (hero && hero.nextSibling) {
                landingPage.insertBefore(historySection, hero.nextSibling);
            } else {
                landingPage.appendChild(historySection);
            }
        }

        const history = SearchHistoryManager.get();
        if (history.length === 0) {
            historySection.style.display = 'none';
            return;
        }

        historySection.style.display = 'block';
        historySection.innerHTML = `
            <div class="section-header">
                <h3><span class="icon">🕒</span> <span class="sv-text">Senaste sökningar</span><span class="ar-text">عمليات البحث الأخيرة</span></h3>
                <button class="clear-history-btn" onclick="window.app.clearHistory()">
                    <span class="sv-text">Rensa</span><span class="ar-text">مسح</span>
                </button>
            </div>
            <div class="history-chips">
                ${history.map(term => `
                    <button class="history-chip" onclick="window.app.performSearch('${term}')">
                        ${term}
                    </button>
                `).join('')}
            </div>
        `;
    }

    public clearHistory() {
        SearchHistoryManager.clear();
        this.renderSearchHistory();
    }

    private updateResultCount() {
        const count = this.currentResults.length;
        const countEl = document.getElementById('resultCount');
        if (countEl) {
            if (count > 0) {
                countEl.textContent = `${count}`;
                countEl.style.display = 'block';
            } else {
                countEl.style.display = 'none';
            }
        }
    }

    public async updateTrainingBadge() {
        try {
            const { DictionaryDB } = await import('./db');
            const count = await DictionaryDB.getTrainingCount();
            const badge = document.getElementById('trainingBadge');

            if (badge) {
                if (count > 0) {
                    badge.textContent = count > 99 ? '99+' : count.toString();
                    badge.classList.remove('hidden');
                    // Add pop animation reset
                    badge.style.animation = 'none';
                    badge.offsetHeight; /* trigger reflow */
                    badge.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                } else {
                    badge.classList.add('hidden');
                }
            }
        } catch (e) {
            console.error('[App] Failed to update training badge:', e);
        }
    }

    public updateFavoritesBadge() {
        try {
            const count = FavoritesManager.count();
            const badge = document.getElementById('favoritesBadge');

            if (badge) {
                if (count > 0) {
                    badge.textContent = count > 99 ? '99+' : count.toString();
                    badge.classList.remove('hidden');
                    // Add pop animation reset
                    badge.style.animation = 'none';
                    badge.offsetHeight; /* trigger reflow */
                    badge.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                } else {
                    badge.classList.add('hidden');
                }
            }
        } catch (e) {
            console.error('[App] Failed to update favorites badge:', e);
        }
    }



    private renderNextBatch() {
        if (this.renderedCount >= this.currentResults.length) return;

        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        const nextBatch = this.currentResults.slice(this.renderedCount, this.renderedCount + this.BATCH_SIZE);
        const html = nextBatch.map(row => this.createCard(row, this.currentQuery)).join('');

        searchResults.insertAdjacentHTML('beforeend', html);
        this.renderedCount += nextBatch.length;

        TextSizeManager.autoApply();
    }

    private createCard(row: any[], searchQuery: string = ''): string {
        const id = row[0];
        const swe = row[2];
        const arb = row[3];
        const type = row[1];
        const forms = row[6] || '';
        const gender = row[13] || '';

        const highlightedSwe = searchQuery ? this.highlightText(swe, searchQuery.toLowerCase()) : swe;
        const highlightedArb = searchQuery ? this.highlightText(arb, searchQuery.toLowerCase()) : arb;

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
                    <h2 class="word-swe" dir="ltr" data-auto-size data-max-lines="1">${highlightedSwe}</h2>
                    ${formsHtml}
                    <p class="word-arb" dir="rtl" data-auto-size data-max-lines="1">${highlightedArb}</p>
                </div>
                <!-- <div class="mastery-bar-container"><div class="mastery-fill" style="width: ${mockMastery}%"></div></div> -->
            </div>
        `;
    }

    private highlightText(text: string, query: string): string {
        if (!query || !text) return text;

        // Remove Arabic diacritics for matching but preserve them in highlighting
        const textWithoutDiacritics = text.replace(/[\u064B-\u065F]/g, '');
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedQuery})`, 'gi');

        // Find matches in text without diacritics
        const matches: Array<{ original: string, withoutDiacritics: string }> = [];
        let match;

        while ((match = regex.exec(textWithoutDiacritics)) !== null) {
            const matchedTextWithoutDiacritics = match[1];
            const matchIndex = match.index;

            // Map position from text without diacritics to original text
            let originalIndex = 0;
            let withoutDiacriticsCount = 0;

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                // Skip diacritics when counting position
                if (!/[\u064B-\u065F]/.test(char)) {
                    if (withoutDiacriticsCount === matchIndex) {
                        // Found the start position - extract original text
                        const originalMatch = this.extractOriginalMatch(text, i, matchedTextWithoutDiacritics);
                        matches.push({
                            original: originalMatch,
                            withoutDiacritics: matchedTextWithoutDiacritics
                        });
                        break;
                    }
                    withoutDiacriticsCount++;
                }
                originalIndex++;
            }
        }

        // Replace matches in original text preserving diacritics
        if (matches.length === 0) return text;

        let result = text;
        for (const match of matches) {
            result = result.replace(match.original, `<span class="search-highlight">${match.original}</span>`);
        }

        return result;
    }

    private extractOriginalMatch(text: string, startPos: number, matchText: string): string {
        let result = '';
        let matchCount = 0;
        let currentPos = startPos;

        // Extract original text that corresponds to the match (including diacritics)
        while (matchCount < matchText.length && currentPos < text.length) {
            const char = text[currentPos];
            result += char;

            // Only count non-diacritic characters towards the match length
            if (!/[\u064B-\u065F]/.test(char)) {
                matchCount++;
            }
            currentPos++;
        }

        return result;
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
}

// Instantiate app if in browser
if (typeof window !== 'undefined') {
    (window as any).app = new App();

    // Global training toggler (exposed for inline HTML calls)
    (window as any).toggleTraining = async function (id: string, btn: HTMLElement, event: Event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        try {
            const { DictionaryDB } = await import('./db');
            const { showToast } = await import('./utils');
            const { SoundManager } = await import('./utils/SoundManager');

            const isCurrentlyTraining = await DictionaryDB.isWordMarkedForTraining(id);
            const newState = !isCurrentlyTraining;

            await DictionaryDB.updateTrainingStatus(id, newState);

            // Update App State
            if ((window as any).app) {
                if (newState) {
                    (window as any).app.trainingIds.add(id);
                } else {
                    (window as any).app.trainingIds.delete(id);
                }
                (window as any).app.updateTrainingBadge();
            }

            // Update Button UI
            if (btn) {
                btn.classList.toggle('active', newState);
                btn.textContent = newState ? '🧠' : '💪';
                btn.title = newState ? 'Ta bort från träning' : 'Lägg till i träning';

                // Animate
                btn.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.2)' },
                    { transform: 'scale(1)' }
                ], { duration: 300 });
            }

            // Feedback
            if (newState) {
                showToast('Tillagd i träning! / تمت الإضافة للتدريب 💪');
                SoundManager.getInstance().play('correct');
            } else {
                showToast('Borttagen från träning / تمت الإزالة 🗑️');
            }

        } catch (e) {
            console.error('Toggle training error:', e);
        }
    };
}
