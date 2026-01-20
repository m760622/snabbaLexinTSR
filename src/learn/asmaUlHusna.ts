// Asma ul Husna - Game Logic
import asmaData from '../data/asmaUlHusna.json';
import { TTSManager } from '../tts';
import { LearnViewManager, LearnView, createLearnViewManager } from './LearnViewManager';

// Asma ul Husna - Game Logic

// Define interface locally since we're using JSON
interface AsmaName {
    nr: number;
    nameAr: string;
    nameSv: string;
    meaningAr: string;
    meaningSv: string;
    pastAr: string;
    pastSv: string;
    presentAr: string;
    presentSv: string;
    masdarAr: string;
    masdarSv: string;
    verseAr: string;
    verseSv: string;
}

const ASMA_UL_HUSNA: AsmaName[] = asmaData as AsmaName[];

let allNames: AsmaName[] = [];
let filteredNames: AsmaName[] = [];

// State for favorites and memorized
let favorites: Set<number> = new Set();
let memorized: Set<number> = new Set();
type FilterType = 'all' | 'favorites' | 'memorized' | 'jalal' | 'jamal' | 'kamal';
let currentFilter: FilterType = 'all';
let currentTheme: 'neon' | 'calm' | 'islamic-night' = 'islamic-night';
let currentLang: 'ar' | 'sv' = 'ar';  // Language to learn: Arabic or Swedish

// Categories Mapping
// Jalal (Majesty/Power), Jamal (Beauty/Mercy), Kamal (Perfection/Essence)
const NAME_CATEGORIES: Record<number, 'jalal' | 'jamal' | 'kamal'> = {
    1: 'jamal', 2: 'jamal', 3: 'jamal', 4: 'jalal', 5: 'jalal', // Allah, Rahman, Rahim, Malik, Quddus
    6: 'jalal', 7: 'jamal', 8: 'jalal', 9: 'jalal', 10: 'jalal', // Salam, Mumin, Muhaymin, Aziz, Jabbar
    11: 'jalal', 12: 'kamal', 13: 'kamal', 14: 'jamal', 15: 'jalal', // Mutakabbir, Khaliq, Bari, Musawwir, Ghaffar
    16: 'jalal', 17: 'jamal', 18: 'jamal', 19: 'kamal', 20: 'jalal', // Qahhar, Wahhab, Razzaq, Fattah, Alim
    21: 'jalal', 22: 'jalal', 23: 'jalal', 24: 'jalal', 25: 'jalal', // Qabid, Basit, Khafid, Rafi, Muizz, Mudhill
    26: 'jalal', 27: 'kamal', 28: 'kamal', 29: 'jalal', 30: 'jamal', // Sami, Basir, Hakam, Adl, Latif
    31: 'kamal', 32: 'jamal', 33: 'jalal', 34: 'jamal', 35: 'jamal', // Khabir, Halim, Azim, Ghafur, Shakur
    40: 'jalal', 41: 'jalal', 47: 'kamal', 48: 'jamal', // Hasib, Jalil, Haqq, Wadud
    // Defaulting others to Kamal for now if not specified (will be refined)
};

function getCategory(nr: number): 'jalal' | 'jamal' | 'kamal' {
    return NAME_CATEGORIES[nr] || 'kamal';
}

// Quiz State
let quizQuestions: AsmaName[] = [];
let currentQuestionIndex = 0;
let quizScore = 0;

// Fill-in-Blank Quiz State
let fillQuizQuestions: any[] = [];
let fillCurrentIndex = 0;
let fillScore = 0;
let fillTotalQuestions = 10;
let fillAutoAdvanceTimer: any = null;

// Flashcard State
let flashcardQueue: AsmaName[] = [];
let currentFlashcardIndex = 0;
let isFlashcardFlipped = false;
let repeatCount = 1;

// Audio Player State
let isPlaying = false;
let isLoopEnabled = false;
let playbackSpeed = 1.0;

// Lazy Loading State
const ITEMS_PER_BATCH = 12; // Load 12 cards per batch
let currentBatchIndex = 0;
let loadMoreObserver: IntersectionObserver | null = null;
let currentPlayIndex = 0;
let audioCycleTimer: any = null;


// Stats & Badges State
let streakDays = 0;
let lastVisitDate = '';

interface Badge {
    id: string;
    icon: string;
    name: string;
    desc: string;
    condition: () => boolean;
}

const BADGES: Badge[] = [
    { id: 'b_start', icon: '🌱', name: 'البداية', desc: 'حفظ أول اسم', condition: () => memorized.size >= 1 },
    { id: 'b_10', icon: '🥉', name: 'المبتدئ', desc: 'حفظ 10 أسماء', condition: () => memorized.size >= 10 },
    { id: 'b_33', icon: '🥈', name: 'المثابر', desc: 'حفظ 33 اسم', condition: () => memorized.size >= 33 },
    { id: 'b_50', icon: '🥇', name: 'المجتهد', desc: 'حفظ 50 اسم', condition: () => memorized.size >= 50 },
    { id: 'b_99', icon: '👑', name: 'الخاتم', desc: 'حفظ جميع الأسماء', condition: () => memorized.size >= 99 },
    { id: 'b_streak3', icon: '🔥', name: 'حماس', desc: 'استمرار 3 أيام', condition: () => streakDays >= 3 },
    { id: 'b_streak7', icon: '⚡', name: 'التزام', desc: 'استمرار 7 أيام', condition: () => streakDays >= 7 }
];

// ========== VIEW MANAGER ==========
const viewManager = createLearnViewManager();

function initViewManager() {
    viewManager.registerViews({
        'browse': {
            viewId: 'browseView',
            onActivate: () => {
                document.getElementById('modeSelectionBar')?.classList.remove('hidden');
            }
        },
        'quiz': {
            viewId: 'quizView',
            onActivate: () => {
                startQuiz(); // Corrected from initQuiz
            }
        },
        'quiz-fill': {
            viewId: 'quizFillView',
            onActivate: () => {
                initFillQuiz();
            }
        },
        'flashcard': {
            viewId: 'flashcardView',
            onActivate: () => {
                startFlashcards();
            }
        }
    });
}

function switchMode(mode: string) {
    viewManager.switchTo(mode as LearnView);

    // Update Mode Bar UI
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    let btnId = '';
    if (mode === 'browse') btnId = 'btn-browse';
    else if (mode === 'quiz') btnId = 'btn-quiz'; // strict check to avoid overlap
    else if (mode === 'quiz-fill') btnId = 'btn-quiz-fill';
    else if (mode === 'flashcard') btnId = 'btn-flashcard';

    if (btnId) {
        const activeBtn = document.getElementById(btnId);
        if (activeBtn) activeBtn.classList.add('active');

        // Animate Sliding Indicator
        updateModeIndicator(activeBtn);
    }
}

// ----------------------------------------------------------------
// Fill-in-Blank Quiz Logic
// ----------------------------------------------------------------

function initFillQuiz() {
    fillQuizQuestions = generateFillQuestions(fillTotalQuestions);
    fillCurrentIndex = 0;
    fillScore = 0;

    const results = document.getElementById('fillResults');
    const questionCard = document.getElementById('fillQuestionCard');
    const options = document.getElementById('fillOptions');
    const feedback = document.getElementById('fillFeedback');

    if (results) results.style.display = 'none';
    if (questionCard) questionCard.style.display = 'block';
    if (options) options.style.display = 'grid';
    if (feedback) feedback.style.display = 'none';

    // Force hide other views just in case
    const quizView = document.getElementById('quizView');
    if (quizView) quizView.classList.add('hidden');

    // Generate Progress Segments
    const progressContainer = document.getElementById('fillSegmentedProgress');
    if (progressContainer) {
        progressContainer.innerHTML = '';
        for (let i = 0; i < fillTotalQuestions; i++) {
            const seg = document.createElement('div');
            seg.className = 'fill-segment';
            seg.id = 'fill-seg-' + i;
            progressContainer.appendChild(seg);
        }
    }

    showFillQuestion();
}

function generateFillQuestions(count: number) {
    // Filter only names that have a verse (not empty or '-')
    const candidates = allNames.filter(item => item.verseAr && item.verseAr.length > 5 && item.verseAr !== '-');
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);

    return shuffled.slice(0, count).map(item => ({
        nameAr: item.nameAr,
        nameSv: item.nameSv,
        meaningSv: item.meaningSv,
        verseAr: item.verseAr,
        verseSv: item.verseSv, // Added for Swedish Mode
        correctAnswer: item.nameAr // Identify by Arabic Name
    }));
}

function showFillQuestion() {
    if (fillCurrentIndex >= fillTotalQuestions) {
        showFillResults();
        return;
    }

    const question = fillQuizQuestions[fillCurrentIndex];
    const currentQ = document.getElementById('fillCurrentQ');
    const totalQ = document.getElementById('fillTotalQ');
    const scoreEl = document.getElementById('fillScore');

    if (currentQ) currentQ.textContent = (fillCurrentIndex + 1).toString();
    if (totalQ) totalQ.textContent = fillTotalQuestions.toString();
    if (scoreEl) scoreEl.textContent = fillScore.toString();

    // Update Progress Segments (Set Current)
    for (let i = 0; i < fillTotalQuestions; i++) {
        const seg = document.getElementById('fill-seg-' + i);
        if (seg) {
            if (i === fillCurrentIndex) {
                seg.classList.add('current');
            } else {
                seg.classList.remove('current');
            }
        }
    }

    const ayahArabic = document.getElementById('fillAyahArabic');
    const ayahTranslation = document.getElementById('fillAyahTranslation');

    if (ayahArabic) {
        // --- SWEDISH MODE ---
        ayahArabic.style.fontFamily = "'Inter', sans-serif";
        ayahArabic.style.direction = "ltr";
        ayahArabic.style.fontSize = "1.8rem";

        if (ayahTranslation) {
            ayahTranslation.style.fontFamily = "'Amiri', serif";
            ayahTranslation.style.direction = "rtl";
            ayahTranslation.style.fontSize = "1.6rem";
            ayahTranslation.style.color = "rgba(255, 215, 0, 0.7)";
            ayahTranslation.style.visibility = 'visible';
            ayahTranslation.textContent = question.verseAr;
        }

        let maskedVerse = question.verseSv;
        const nameSv = question.nameSv;
        const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        let pattern = escapeRegExp(nameSv);
        let regex = new RegExp(pattern, 'gi');

        if (regex.test(maskedVerse)) {
            maskedVerse = maskedVerse.replace(regex, '<span class="fill-blank">_______</span>');
        } else {
            const shortName = nameSv.replace(/^(Den|Det)\s+/i, '');
            if (shortName.length > 3 && shortName !== nameSv) {
                const shortPattern = escapeRegExp(shortName);
                const shortRegex = new RegExp(shortPattern, 'gi');
                if (shortRegex.test(maskedVerse)) {
                    maskedVerse = maskedVerse.replace(shortRegex, '<span class="fill-blank">_______</span>');
                }
            }
        }

        ayahArabic.innerHTML = `<div class="fill-verse-text" style="font-family: inherit; direction: ltr;">${maskedVerse}</div>`;
    }

    generateFillOptions(question);

    const feedback = document.getElementById('fillFeedback');
    if (feedback) feedback.style.display = 'none';
}

function generateFillOptions(question: any) {
    const options = document.getElementById('fillOptions');
    if (!options) return;

    // Correct Answer is Swedish Name
    const correct = question.nameSv;

    // Distractors: other Swedish Names
    const wrongAnswers = allNames
        .filter(item => item.nameSv !== correct)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(item => item.nameSv);

    const allOptions = [correct, ...wrongAnswers].sort(() => Math.random() - 0.5);

    // Use Latin font style
    options.innerHTML = allOptions.map(option => `
        <button class="fill-option-btn" style="font-family: 'Inter', sans-serif; font-size: 1.1rem; line-height: 1.2;" data-answer="${option}">
            ${option}
        </button>`).join('');

    options.querySelectorAll('.fill-option-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selected = (e.target as HTMLElement).getAttribute('data-answer');
            checkFillAnswer(selected, correct, question);
        });
    });
}

function checkFillAnswer(selected: string | null, correct: string, question: any) {
    const feedback = document.getElementById('fillFeedback');
    const options = document.getElementById('fillOptions');
    const mainTextEl = document.getElementById('fillAyahArabic');
    const scoreEl = document.getElementById('fillScore');

    const isCorrect = selected === correct;

    // Update Segment Status
    const currentSeg = document.getElementById('fill-seg-' + fillCurrentIndex);
    if (currentSeg) {
        currentSeg.classList.remove('current');
        if (isCorrect) currentSeg.classList.add('correct');
        else currentSeg.classList.add('wrong');
    }

    const clickedBtn = options?.querySelector(`button[data-answer="${selected}"]`);

    if (isCorrect) {
        fillScore++;
        if (scoreEl) scoreEl.textContent = fillScore.toString();

        if (clickedBtn && mainTextEl) {
            clickedBtn.classList.add('correct');
            const blank = mainTextEl.querySelector('.fill-blank') as HTMLElement;
            if (blank) {
                animateFlyToFill(clickedBtn as HTMLElement, blank, () => {
                    updateVerseWithHighlight(mainTextEl, question);
                });
            } else {
                updateVerseWithHighlight(mainTextEl, question);
            }
        } else {
            if (mainTextEl) updateVerseWithHighlight(mainTextEl, question);
        }

    } else {
        if (clickedBtn) {
            clickedBtn.classList.add('wrong');
            clickedBtn.animate([
                { transform: 'translateX(0)' },
                { transform: 'translateX(-10px)' },
                { transform: 'translateX(10px)' },
                { transform: 'translateX(0)' }
            ], { duration: 400 });
        }
    }

    options?.querySelectorAll('.fill-option-btn').forEach(btn => {
        (btn as HTMLButtonElement).disabled = true;
        if (btn.getAttribute('data-answer') === correct && !isCorrect) {
            btn.classList.add('correct');
        }
    });

    if (fillAutoAdvanceTimer) clearTimeout(fillAutoAdvanceTimer);
    fillAutoAdvanceTimer = setTimeout(() => {
        nextFillQuestion();
    }, isCorrect ? 4000 : 5000);
}

function updateVerseWithHighlight(container: HTMLElement, question: any) {
    let fullVerse = question.verseSv;
    const highlightHtml = `<span class="highlight-word success">${question.nameSv}</span>`;
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const nameSv = question.nameSv;
    let pattern = escapeRegExp(nameSv);
    let regex = new RegExp(pattern, 'gi');

    if (regex.test(fullVerse)) {
        fullVerse = fullVerse.replace(regex, highlightHtml);
    } else {
        const shortName = nameSv.replace(/^(Den|Det)\s+/i, '');
        if (shortName.length > 3) {
            const shortPattern = escapeRegExp(shortName);
            const shortRegex = new RegExp(shortPattern, 'gi');
            if (shortRegex.test(fullVerse)) {
                fullVerse = fullVerse.replace(shortRegex, highlightHtml);
            }
        }
    }

    container.innerHTML = `<div class="fill-verse-text" style="font-family: inherit; direction: ltr;">${fullVerse}</div>`;
}

function animateFlyToFill(startEl: HTMLElement, targetEl: HTMLElement, onComplete: () => void) {
    // 1. Create Clone
    const clone = document.createElement('div');
    clone.textContent = startEl.innerText;
    clone.className = 'fly-item';

    // 2. Get Coordinates
    const startRect = startEl.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    // 3. Set Initial Position
    clone.style.top = `${startRect.top}px`;
    clone.style.left = `${startRect.left}px`;
    clone.style.width = `${startRect.width}px`;
    clone.style.height = `${startRect.height}px`;
    // Align text center vertically/horizontally
    clone.style.display = 'flex';
    clone.style.alignItems = 'center';
    clone.style.justifyContent = 'center';
    clone.style.margin = '0';

    document.body.appendChild(clone);

    // 4. Force Reflow
    clone.getBoundingClientRect();

    // 5. Animate to Target
    // We want it to shrink/grow to match target size? target is usually small '_______'
    // Actually target is a span in text.

    requestAnimationFrame(() => {
        clone.style.top = `${targetRect.top}px`;
        clone.style.left = `${targetRect.left}px`;
        clone.style.width = `${targetRect.width}px`;
        clone.style.height = `${targetRect.height}px`;
        clone.style.fontSize = '1.8rem'; // Match verse font size roughly
        clone.style.background = 'transparent'; // box style to text style
        clone.style.boxShadow = 'none';
        clone.style.color = '#4ade80'; // Success color
    });

    // 6. Cleanup
    clone.addEventListener('transitionend', () => {
        clone.remove();
        onComplete();
    });
}

function nextFillQuestion() {
    if (fillAutoAdvanceTimer) {
        clearTimeout(fillAutoAdvanceTimer);
        fillAutoAdvanceTimer = null;
    }
    fillCurrentIndex++;
    showFillQuestion();
}

function showFillResults() {
    const questionCard = document.getElementById('fillQuestionCard');
    const results = document.getElementById('fillResults');

    if (questionCard) questionCard.style.display = 'none';
    if (results) results.style.display = 'block';

    const finalScore = document.getElementById('fillFinalScore');
    const finalTotal = document.getElementById('fillFinalTotal');
    const percentage = document.getElementById('fillPercentage');

    if (finalScore) finalScore.textContent = fillScore.toString();
    if (finalTotal) finalTotal.textContent = fillTotalQuestions.toString();
    if (percentage) {
        const percent = Math.round((fillScore / fillTotalQuestions) * 100);
        percentage.textContent = `${percent}%`;
    }
}

function updateModeIndicator(activeBtn: HTMLElement | null) {
    const indicator = document.getElementById('modeIndicator');
    const bar = document.getElementById('modeSelectionBar');
    if (!indicator || !bar || !activeBtn) return;

    const barRect = bar.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    // Calculate offset relative to the bar
    const offsetLeft = btnRect.left - barRect.left;

    indicator.style.width = `${btnRect.width}px`;
    indicator.style.transform = `translateX(${offsetLeft - 6}px)`; // -6px for padding offset
}

// Load saved state from localStorage
function loadSavedState(): void {
    try {
        const savedFavorites = localStorage.getItem('asma_favorites');
        const savedMemorized = localStorage.getItem('asma_memorized');
        const savedRepeat = localStorage.getItem('asma_repeat');

        if (savedFavorites) favorites = new Set(JSON.parse(savedFavorites));
        if (savedMemorized) memorized = new Set(JSON.parse(savedMemorized));
        if (savedRepeat) repeatCount = parseInt(savedRepeat);

        // Load Streak
        streakDays = parseInt(localStorage.getItem('asma_streak') || '0');
        lastVisitDate = localStorage.getItem('asma_last_visit') || '';

        calculateStreak();
        updateRepeatButtons();
    } catch (e) {
        console.error('[AsmaUlHusna] Failed to load saved state:', e);
    }
}

function calculateStreak(): void {
    const today = new Date().toISOString().split('T')[0];

    if (lastVisitDate !== today) {
        if (lastVisitDate) {
            const lastDate = new Date(lastVisitDate);
            const currentDate = new Date(today);
            const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day
                streakDays++;
            } else if (diffDays > 1) {
                // Streak broken
                streakDays = 1;
            }
            // If diffDays == 0 (same day), do nothing
        } else {
            // First visit ever
            streakDays = 1;
        }

        lastVisitDate = today;
        saveState();
    }
}

// Save state to localStorage
function saveState(): void {
    localStorage.setItem('asma_favorites', JSON.stringify([...favorites]));
    localStorage.setItem('asma_memorized', JSON.stringify([...memorized]));
    localStorage.setItem('asma_repeat', repeatCount.toString());
    localStorage.setItem('asma_streak', streakDays.toString());
    localStorage.setItem('asma_last_visit', lastVisitDate);
}

// Toggle favorite
function toggleFavorite(nr: number): void {
    if (favorites.has(nr)) {
        favorites.delete(nr);
    } else {
        favorites.add(nr);
    }
    saveState();
    renderCards();
    updateFilterCounts();
}

// Toggle memorized
function toggleMemorized(nr: number): void {
    if (memorized.has(nr)) {
        memorized.delete(nr);
    } else {
        memorized.add(nr);
    }
    saveState();
    renderCards();
    updateFilterCounts();
}

// Set filter
function setFilter(filter: FilterType): void {
    currentFilter = filter;

    // Update button states
    document.querySelectorAll('.asma-filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
    });

    applyFilters();
}

// Remove Arabic diacritics (harakat) for search
function normalizeArabic(text: string): string {
    // Arabic diacritics: fatha, damma, kasra, sukun, shadda, tanwin, etc.
    return text.replace(/[\u064B-\u065F\u0670]/g, '');
}

// Apply all filters (search + category filter)
function applyFilters(): void {
    const searchInput = document.getElementById('asmaSearch') as HTMLInputElement;
    const modeSearchInput = document.getElementById('asmaModeSearch') as HTMLInputElement;
    const rawQuery = (searchInput?.value || modeSearchInput?.value || '').trim();
    const query = normalizeArabic(rawQuery).toLowerCase();

    // Start with all names
    let result = [...allNames];

    // Apply category filter
    if (currentFilter === 'favorites') {
        result = result.filter(name => favorites.has(name.nr));
    } else if (currentFilter === 'memorized') {
        result = result.filter(name => memorized.has(name.nr));
    } else if (currentFilter === 'jalal' || currentFilter === 'jamal' || currentFilter === 'kamal') {
        result = result.filter(name => getCategory(name.nr) === currentFilter);
    }

    // Apply search filter (with diacritics normalization)
    if (query) {
        result = result.filter(name =>
            normalizeArabic(name.nameAr).includes(query) ||
            name.nameSv.toLowerCase().includes(query) ||
            normalizeArabic(name.meaningAr).includes(query) ||
            name.meaningSv.toLowerCase().includes(query) ||
            name.nr.toString() === rawQuery
        );
    }

    filteredNames = result;
    renderCards();
    updateStats();
}

// Update filter button counts
function updateFilterCounts(): void {
    const allBtn = document.querySelector('[data-filter="all"]');
    const favBtn = document.querySelector('[data-filter="favorites"]');
    const memBtn = document.querySelector('[data-filter="memorized"]');
    const jalalBtn = document.querySelector('[data-filter="jalal"]');
    const jamalBtn = document.querySelector('[data-filter="jamal"]');
    const kamalBtn = document.querySelector('[data-filter="kamal"]');

    const jalalCount = allNames.filter(n => getCategory(n.nr) === 'jalal').length;
    const jamalCount = allNames.filter(n => getCategory(n.nr) === 'jamal').length;
    const kamalCount = allNames.filter(n => getCategory(n.nr) === 'kamal').length;

    if (allBtn) allBtn.textContent = `الكل (${allNames.length})`;
    if (favBtn) favBtn.textContent = `❤️ (${favorites.size})`;
    if (memBtn) memBtn.textContent = `✓ (${memorized.size})`;
    if (jalalBtn) jalalBtn.textContent = `الجلال (${jalalCount})`;
    if (jamalBtn) jamalBtn.textContent = `الجمال (${jamalCount})`;
    if (kamalBtn) kamalBtn.textContent = `الكمال (${kamalCount})`;
}


// Initialize
function init(): void {
    initViewManager();
    loadSavedState();
    allNames = ASMA_UL_HUSNA;
    filteredNames = [...allNames];
    renderCards();
    updateStats();
    loadTheme();
    loadLang();  // Load saved language preference
    updateFilterCounts();
    createGoldenParticles();
}

// Render all cards with lazy loading using IntersectionObserver
function renderCards(): void {
    const grid = document.getElementById('asmaCardsGrid');
    if (!grid) return;

    // Reset lazy loading state
    currentBatchIndex = 0;

    // Clear grid
    grid.innerHTML = '';

    // Hide loading indicator immediately since we're using lazy loading
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.style.display = 'none';

    if (filteredNames.length === 0) {
        grid.innerHTML = '<div style="text-align:center; color:#ccc; padding:2rem;">لا توجد نتائج</div>';
        return;
    }

    // Render first batch immediately
    renderBatch(grid);

    // Setup intersection observer for lazy loading
    setupLazyLoading(grid);
}

// Render a batch of cards
function renderBatch(container: HTMLElement): void {
    const startIndex = currentBatchIndex * ITEMS_PER_BATCH;
    const endIndex = Math.min(startIndex + ITEMS_PER_BATCH, filteredNames.length);

    if (startIndex >= filteredNames.length) return;

    const fragment = document.createDocumentFragment();

    for (let i = startIndex; i < endIndex; i++) {
        const card = document.createElement('div');
        card.innerHTML = createCardHTML(filteredNames[i]);
        const cardElement = card.firstElementChild as HTMLElement;
        if (cardElement) fragment.appendChild(cardElement);
    }

    // Remove old sentinel if exists
    const oldSentinel = container.querySelector('.load-more-sentinel');
    if (oldSentinel) oldSentinel.remove();

    container.appendChild(fragment);
    currentBatchIndex++;

    // Add sentinel for next batch if more items exist
    if (endIndex < filteredNames.length) {
        const sentinel = document.createElement('div');
        sentinel.className = 'load-more-sentinel';
        sentinel.style.cssText = 'height: 50px; display: flex; align-items: center; justify-content: center; color: #fbbf24; opacity: 0.7;';
        const remaining = filteredNames.length - endIndex;
        sentinel.innerHTML = `<span>⏳ جاري تحميل ${Math.min(ITEMS_PER_BATCH, remaining)} اسماً آخر...</span>`;
        container.appendChild(sentinel);
    } else {
        // Show end message
        const endMessage = document.createElement('div');
        endMessage.className = 'end-of-list';
        endMessage.style.cssText = 'text-align: center; padding: 1rem; color: #fbbf24; opacity: 0.6;';
        endMessage.innerHTML = `✨ تم عرض ${filteredNames.length} اسماً`;
        container.appendChild(endMessage);
    }

    // Re-observe the new sentinel for the next batch
    const newSentinel = container.querySelector('.load-more-sentinel');
    if (newSentinel && loadMoreObserver) {
        loadMoreObserver.observe(newSentinel);
    }
}

// Setup IntersectionObserver for lazy loading
function setupLazyLoading(container: HTMLElement): void {
    // Disconnect previous observer
    if (loadMoreObserver) {
        loadMoreObserver.disconnect();
    }

    loadMoreObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.classList.contains('load-more-sentinel')) {
                renderBatch(container);
            }
        });
    }, {
        root: null,
        rootMargin: '200px', // Load before user reaches sentinel
        threshold: 0.1
    });

    // Observe sentinel
    const sentinel = container.querySelector('.load-more-sentinel');
    if (sentinel) {
        loadMoreObserver.observe(sentinel);
    }
}

// Create single card HTML - full design with animations
function createCardHTML(name: AsmaName): string {
    const hasConjugation = name.pastAr !== '-';
    const isFavorite = favorites.has(name.nr);
    const isMemorized = memorized.has(name.nr);
    const category = getCategory(name.nr);
    const categoryLabel = category === 'jalal' ? 'الجلال' : category === 'jamal' ? 'الجمال' : 'الكمال';

    return `
        <div class="asma-card ${category}${isMemorized ? ' memorized' : ''}" data-nr="${name.nr}" 
             onclick="toggleCardExpansion(${name.nr})"
             style="animation: fadeInUp 0.2s ease-out forwards;">
            
            <!-- Card Head: Visible when collapsed -->
            <div class="asma-card-head">
                <!-- Row 1: Number & Badge -->
                <div class="head-row-top">
                     <div class="asma-number">${name.nr}</div>
                     <div class="category-badge-header ${category}">${categoryLabel}</div>
                </div>

                <!-- Row 2: Names -->
                <div class="head-row-names">
                    <div class="asma-name-ar-mini">${name.nameAr}</div>
                    <div class="asma-name-sv-mini">${name.nameSv}</div>
                </div>

                <!-- Row 3: Actions -->
                <div class="card-head-actions">
                    <button class="asma-action-btn speak-btn" onclick="event.stopPropagation(); speakName(${name.nr})" title="استماع">
                        🔊
                    </button>
                    <button class="asma-action-btn asma-memorize-btn ${isMemorized ? 'active' : ''}" 
                            onclick="event.stopPropagation(); toggleMemorized(${name.nr})" title="حفظ">
                        ${isMemorized ? '✓' : '📝'}
                    </button>
                    <button class="asma-action-btn favorite-btn ${isFavorite ? 'active' : ''}" 
                            onclick="event.stopPropagation(); toggleFavorite(${name.nr})" title="المفضلة">
                        ${isFavorite ? '❤️' : '🤍'}
                    </button>
                    <div class="expand-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Card Body: Visible when expanded -->
            <div class="asma-card-body">
                <!-- Badge moved to header -->
                
                <div class="expanded-section">
                    <div class="asma-name-ar lang-primary">${name.nameAr}</div>
                    <div class="asma-name-sv lang-primary">${name.nameSv}</div>
                </div>

                <div class="expanded-section">
                    <div class="meaning-ar">${name.meaningAr}</div>
                    <div class="meaning-sv">${name.meaningSv}</div>
                </div>

                ${hasConjugation ? `
                <div class="expanded-section">
                    <div class="asma-conjugation">
                        <div class="conj-item">
                            <div class="conj-ar">${name.pastAr}</div>
                            <div class="conj-sv">${name.pastSv}</div>
                        </div>
                        <div class="conj-item">
                            <div class="conj-ar">${name.presentAr}</div>
                            <div class="conj-sv">${name.presentSv}</div>
                        </div>
                        <div class="conj-item">
                            <div class="conj-ar">${name.masdarAr}</div>
                            <div class="conj-sv">${name.masdarSv}</div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="expanded-section">
                    <div class="verse-ar">${name.verseAr}</div>
                    <div class="verse-sv">${name.verseSv}</div>
                </div>
            </div>
        </div>
    `;
}

function toggleCardExpansion(nr: number): void {
    const card = document.querySelector(`.asma-card[data-nr="${nr}"]`);
    if (card) {
        card.classList.toggle('expanded');

        // If expanded, scroll into view if needed
        if (card.classList.contains('expanded')) {
            setTimeout(() => {
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        }
    }
}

// Filter names (for search input)
function filterNames(): void {
    applyFilters();
}

// Update stats
function updateStats(): void {
    const statsEl = document.getElementById('asmaStats');
    if (statsEl) {
        const memorizedCount = filteredNames.filter(n => memorized.has(n.nr)).length;
        statsEl.textContent = `عرض ${filteredNames.length} من ${allNames.length} اسم | محفوظ: ${memorizedCount}`;
    }
}

// Speak name using TTS with enhanced visual effects
let currentSpeakTimeout: any = null;

function speakName(nr: number, isAutoPlay: boolean = false, onComplete?: () => void): void {
    if (currentSpeakTimeout) {
        clearTimeout(currentSpeakTimeout);
        currentSpeakTimeout = null;
    }
    document.querySelectorAll('.speaking').forEach(el => el.classList.remove('speaking'));
    document.querySelectorAll('.card-speaking').forEach(el => el.classList.remove('card-speaking'));

    if (!isAutoPlay && isPlaying) stopAudio();

    const nameData = allNames.find(n => n.nr === nr);
    if (!nameData) return;

    const isArabic = currentLang === 'ar';
    const text = isArabic ? nameData.nameAr : nameData.nameSv;
    const lang = isArabic ? 'ar-SA' : 'sv-SE';

    const card = document.querySelector(`[data-nr="${nr}"]`);
    const btn = card?.querySelector('.asma-speak-btn');
    btn?.classList.add('speaking');
    card?.classList.add('card-speaking');

    const effectiveRepeat = repeatCount;
    let count = 0;

    const doSpeak = () => {
        const rate = playbackSpeed;
        if (isArabic && typeof TTSManager !== 'undefined' && TTSManager) {
            TTSManager.speak(text, 'ar', { speed: rate });
        } else {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = isArabic ? rate * 0.8 : rate * 0.9;
            speechSynthesis.speak(utterance);
        }
    };

    const speakLoop = () => {
        if (isAutoPlay && !isPlaying) {
            btn?.classList.remove('speaking');
            card?.classList.remove('card-speaking');
            return;
        }

        if (count < effectiveRepeat) {
            doSpeak();
            count++;
            if (count < effectiveRepeat) {
                currentSpeakTimeout = setTimeout(speakLoop, 2500 / playbackSpeed);
            } else {
                currentSpeakTimeout = setTimeout(() => {
                    btn?.classList.remove('speaking');
                    card?.classList.remove('card-speaking');
                    if (onComplete) onComplete();
                }, 1500 / playbackSpeed);
            }
        }
    };
    speakLoop();
}


// Set Repeat Count
function setRepeatCount(count: number): void {
    repeatCount = count;
    saveState();
    updateRepeatButtons();
}

function updateRepeatButtons(): void {
    document.querySelectorAll('.repeat-count-btn, .repeat-pill').forEach(btn => {
        const btnCount = parseInt(btn.getAttribute('data-count') || '1');
        btn.classList.toggle('active', btnCount === repeatCount);
    });

    // Update Player Repeat Button
    const playerRepeatBtn = document.getElementById('playerRepeatBtn');
    if (playerRepeatBtn) {
        playerRepeatBtn.textContent = `↻ ${repeatCount}x`;
    }
}

// Golden Particles System
function createGoldenParticles(): void {
    const container = document.getElementById('particlesContainer');
    if (!container) return;

    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'gold-particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 15}s`;
        particle.style.animationDuration = `${15 + Math.random() * 10}s`;
        container.appendChild(particle);
    }
}

// Theme management with Islamic Night Theme
function loadTheme(): void {
    const savedTheme = localStorage.getItem('asmaTheme') || 'islamic-night';
    currentTheme = savedTheme as typeof currentTheme;
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton();
}

function toggleTheme(): void {
    // strict Day/Night toggle
    currentTheme = currentTheme === 'islamic-night' ? 'calm' : 'islamic-night';

    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('asmaTheme', currentTheme);
    updateThemeButton();
}

function updateThemeButton(): void {
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.classList.remove('calm-active', 'night-active');

        // Remove existing icon
        btn.innerHTML = '';

        if (currentTheme === 'calm') {
            btn.classList.add('calm-active');
            // Day Mode is active, show Moon to switch to Night
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
            btn.title = 'الوضع الحالي: نهاري (اضغط للوضع الليلي)';
        } else {
            btn.classList.add('night-active');
            // Night Mode is active, show Sun to switch to Day
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
            btn.title = 'الوضع الحالي: ليلي (اضغط للوضع النهاري)';
        }
    }
}

// Render filter buttons
function renderFilterButtons(): void {
    updateFilterCounts();
}

// Mobile View Toggle
function toggleMobileView(): void {
    const isMobile = document.body.classList.toggle('iphone-view');
    localStorage.setItem('mobileView', isMobile.toString());
    updateMobileButton(isMobile);
}

function loadMobileView(): void {
    const savedMobile = localStorage.getItem('mobileView') === 'true';
    if (savedMobile) {
        document.body.classList.add('iphone-view');
    }
    updateMobileButton(savedMobile);
}

function updateMobileButton(isMobile: boolean): void {
    const btn = document.getElementById('mobileToggle');
    if (btn) {
        btn.classList.toggle('mobile-active', isMobile);
    }
}

// ========== LANGUAGE TOGGLE ==========

function toggleLang(): void {
    currentLang = currentLang === 'ar' ? 'sv' : 'ar';
    localStorage.setItem('asma_lang', currentLang);
    updateLangButton();
    renderCards(); // Re-render to show the selected language prominently
    updatePlayerUI(); // Update player title if active
}

function loadLang(): void {
    currentLang = (localStorage.getItem('asma_lang') as 'ar' | 'sv') || 'ar';
    updateLangButton();
}

function updateLangButton(): void {
    const label = document.getElementById('langLabel');
    const btn = document.getElementById('langToggle');
    if (label) {
        label.textContent = currentLang === 'ar' ? 'ع' : 'Sv';
    }
    if (btn) {
        btn.title = currentLang === 'ar' ? 'اللغة: عربي' : 'Språk: Svenska';
    }
}

// ========== QUIZ LOGIC ==========

function startQuiz(): void {
    // Generate 10 random questions
    quizQuestions = [...allNames].sort(() => 0.5 - Math.random()).slice(0, 10);
    currentQuestionIndex = 0;
    quizScore = 0;

    // Initialize Segmented Progress Bar
    const progressBar = document.querySelector('.quiz-progress-bar');
    if (progressBar) {
        progressBar.innerHTML = '';
        // Create 10 segments
        for (let i = 0; i < 10; i++) {
            const segment = document.createElement('div');
            segment.className = 'quiz-segment future';
            segment.id = `quiz-segment-${i}`;
            progressBar.appendChild(segment);
        }
    }

    // View is already activated by manager
    renderQuizQuestion();
}

function closeQuiz(): void {
    switchMode('browse');
}

function renderQuizQuestion(): void {
    const container = document.getElementById('quizContent');
    if (!container) return;

    // Check if finished
    if (currentQuestionIndex >= quizQuestions.length) {
        showQuizResults(container);
        return;
    }

    const question = quizQuestions[currentQuestionIndex];

    // Generate options (1 correct + 3 wrong)
    const options = [question];
    while (options.length < 4) {
        const random = allNames[Math.floor(Math.random() * allNames.length)];
        if (!options.find(o => o.nr === random.nr)) {
            options.push(random);
        }
    }

    // Shuffle options
    const shuffledOptions = options.sort(() => 0.5 - Math.random());

    container.innerHTML = `
        <div class="quiz-question">
            <div class="quiz-question-label">ما معنى هذا الاسم؟</div>
            <div class="quiz-question-name">${question.nameAr}</div>
        </div>
        <div class="quiz-options">
            ${shuffledOptions.map(opt => `
                <button class="quiz-option" data-nr="${opt.nr}" onclick="checkAnswer(${opt.nr}, ${question.nr}, this)">
                    ${opt.meaningSv} <span class="quiz-answer-ar" style="display:none; color: #fbbf24; margin-right: 5px;">(${opt.meaningAr})</span>
                </button>
            `).join('')}
        </div>
    `;

    updateQuizProgress();
}

function checkAnswer(selectedNr: number, correctNr: number, btn: HTMLElement): void {
    // Disable all buttons
    const buttons = document.querySelectorAll('.quiz-option');
    buttons.forEach(b => b.classList.add('disabled'));

    // Reveal Arabic Text for the selected button
    const selectedAr = btn.querySelector('.quiz-answer-ar') as HTMLElement;
    if (selectedAr) selectedAr.style.display = 'inline';

    // Update Segment Status
    const segment = document.getElementById(`quiz-segment-${currentQuestionIndex}`);
    if (segment) {
        segment.classList.remove('current', 'future');
        if (selectedNr === correctNr) {
            segment.classList.add('correct');
        } else {
            segment.classList.add('wrong');
        }
    }

    if (selectedNr === correctNr) {
        btn.classList.add('correct');
        quizScore++;
        // Play correct sound (optional)
    } else {
        btn.classList.add('wrong');
        // Highlight correct answer
        const correctBtn = document.querySelector(`.quiz-option[data-nr="${correctNr}"]`);
        if (correctBtn) {
            correctBtn.classList.add('correct');
            // Reveal Arabic Text for the correct button too
            const correctAr = correctBtn.querySelector('.quiz-answer-ar') as HTMLElement;
            if (correctAr) correctAr.style.display = 'inline';
        }
    }

    // Wait and go to next
    setTimeout(() => {
        currentQuestionIndex++;
        renderQuizQuestion();
    }, 1500);
}

function updateQuizProgress(): void {
    const scoreText = document.getElementById('quizScore');

    // Update Current Segment Indicator
    if (currentQuestionIndex < 10) {
        const currentSegment = document.getElementById(`quiz-segment-${currentQuestionIndex}`);
        if (currentSegment) {
            // Ensure no conflicting classes
            currentSegment.classList.remove('future', 'correct', 'wrong');
            currentSegment.classList.add('current');
        }
    }

    if (scoreText) scoreText.textContent = `${Math.min(currentQuestionIndex + 1, quizQuestions.length)}/10`;
}

function showQuizResults(container: HTMLElement): void {
    const percentage = Math.round((quizScore / quizQuestions.length) * 100);
    let message = '';
    let icon = '';

    if (percentage === 100) { message = 'ممتاز! ما شاء الله'; icon = '🏆'; }
    else if (percentage >= 80) { message = 'رائع جداً'; icon = '🌟'; }
    else if (percentage >= 50) { message = 'جيد، استمر'; icon = '👍'; }
    else { message = 'حاول مرة أخرى'; icon = '📚'; }

    container.innerHTML = `
        <div class="quiz-result">
            <div class="quiz-result-icon">${icon}</div>
            <div class="quiz-result-text">${message}</div>
            <div class="quiz-result-score">${quizScore} / ${quizQuestions.length}</div>
            <div class="quiz-actions">
                <button class="quiz-action-btn" onclick="closeQuiz()">إغلاق</button>
                <button class="quiz-action-btn primary" onclick="startQuiz()">إعادة الاختبار</button>
            </div>
        </div>
    `;
}

// ========== FLASHCARD LOGIC ==========

function startFlashcards(): void {
    flashcardQueue = [...filteredNames]; // Use current filtered list
    if (flashcardQueue.length === 0) flashcardQueue = [...allNames];

    // Shuffle
    flashcardQueue.sort(() => 0.5 - Math.random());

    currentFlashcardIndex = 0;
    isFlashcardFlipped = false;

    // View is already activated by manager
    renderFlashcard();
}

function closeFlashcards(): void {
    switchMode('browse');
}

function renderFlashcard(): void {
    if (currentFlashcardIndex >= flashcardQueue.length) {
        // Cycle completed
        alert('أتممت مراجعة المجموعة!');
        closeFlashcards();
        return;
    }

    const name = flashcardQueue[currentFlashcardIndex];
    const card = document.getElementById('flashcard');

    // Reset flip
    isFlashcardFlipped = false;
    card?.classList.remove('flipped');

    // Update Content
    // Front
    const nameEl = document.getElementById('flashcardName');
    const nrFront = document.getElementById('flashcardNumber');
    if (nameEl) nameEl.textContent = name.nameAr;
    if (nrFront) nrFront.textContent = name.nr.toString();

    // Back
    const arMeaning = document.getElementById('flashcardMeaningAr');
    const svMeaning = document.getElementById('flashcardMeaningSv');
    const nrBack = document.getElementById('flashcardNumberBack');

    if (arMeaning) arMeaning.textContent = name.meaningAr;
    if (svMeaning) svMeaning.textContent = name.meaningSv;
    if (nrBack) nrBack.textContent = name.nr.toString();

    // Progress
    const progress = document.getElementById('flashcardProgress');
    if (progress) progress.textContent = `${currentFlashcardIndex + 1} / ${flashcardQueue.length}`;
}

function flipFlashcard(): void {
    const card = document.getElementById('flashcard');
    isFlashcardFlipped = !isFlashcardFlipped;
    card?.classList.toggle('flipped', isFlashcardFlipped);

    if (isFlashcardFlipped) {
        // Auto play sound when flipped? Maybe optional.
        const name = flashcardQueue[currentFlashcardIndex];
        // speakName(name.nameAr, name.nr); // Keeping silent for now to let user read first
    }
}

function flashcardKnow(): void {
    // Mark as memorized if not already?
    const name = flashcardQueue[currentFlashcardIndex];
    if (!memorized.has(name.nr)) {
        toggleMemorized(name.nr);
    }

    nextFlashcard();
}

function flashcardDontKnow(): void {
    nextFlashcard();
}

function nextFlashcard(): void {
    currentFlashcardIndex++;
    if (currentFlashcardIndex >= flashcardQueue.length) {
        // Cycle completed
        alert('أتممت مراجعة المجموعة!');
        closeFlashcards();
    } else {
        renderFlashcard();
    }
}

function speakCurrentFlashcard(): void {
    // Stop propagation of click to prevent flip
    event?.stopPropagation();

    const name = flashcardQueue[currentFlashcardIndex];
    speakName(name.nr);
}

// ========== STATS LOGIC ==========

function openStats(): void {
    const modal = document.getElementById('statsModal');
    if (modal) {
        modal.classList.add('active');
        updateStatsUI();
    }
}

function closeStats(): void {
    const modal = document.getElementById('statsModal');
    if (modal) modal.classList.remove('active');
}

function updateStatsUI(): void {
    // 1. Update Streak
    const streakEl = document.getElementById('streakCounter');
    if (streakEl) streakEl.textContent = `🔥 ${streakDays} يوم متواصل`;

    // 2. Update Progress Rings
    updateProgressRing('ringMemorized', 'textMemorized', memorized.size, 99, true);
    updateProgressRing('ringFavorites', 'textFavorites', favorites.size, 99, false);

    // 3. Render Badges
    renderBadges();
}

function updateProgressRing(ringId: string, textId: string, value: number, max: number, isPercent: boolean): void {
    const ring = document.getElementById(ringId);
    const text = document.getElementById(textId);

    if (ring && text) {
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const percent = Math.min(100, (value / max) * 100);
        const offset = circumference - (percent / 100) * circumference;

        ring.style.strokeDasharray = `${circumference} ${circumference}`;
        ring.style.strokeDashoffset = offset.toString();

        text.textContent = isPercent ? `${Math.round(percent)}%` : value.toString();
    }
}

function renderBadges(): void {
    const grid = document.getElementById('badgesGrid');
    if (!grid) return;

    grid.innerHTML = BADGES.map(badge => {
        const isUnlocked = badge.condition();
        return `
            <div class="badge-item ${isUnlocked ? 'unlocked' : ''}">
                <span class="badge-icon">${badge.icon}</span>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-desc">${badge.desc}</div>
            </div>
        `;
    }).join('');
}

// ========== AUDIO PLAYER LOGIC ==========

function togglePlay(): void {
    if (isPlaying) {
        stopAudio();
    } else {
        startAudio();
    }
}

function startAudio(): void {
    if (filteredNames.length === 0) return;

    isPlaying = true;
    updatePlayerUI();
    playCurrentAudio();

    // Show player bar if hidden
    const player = document.getElementById('audioPlayer');
    if (player) player.classList.remove('hidden');

    // Update nav button state
    const audioBtn = document.getElementById('audioBtn');
    if (audioBtn) audioBtn.classList.add('playing');
}

function stopAudio(): void {
    isPlaying = false;
    clearTimeout(audioCycleTimer);
    updatePlayerUI();
    TTSManager.stop();

    // Update nav button state
    const audioBtn = document.getElementById('audioBtn');
    if (audioBtn) audioBtn.classList.remove('playing');
}

function playCurrentAudio(): void {
    if (!isPlaying) return;

    // Ensure index is valid
    if (currentPlayIndex >= filteredNames.length) {
        currentPlayIndex = 0;
        if (!isLoopEnabled) {
            stopAudio();
            return;
        }
    }

    const name = filteredNames[currentPlayIndex];
    updatePlayerUI();

    // Speak name with callback for next item
    speakName(name.nr, true, () => {
        // This callback runs after all repetitions are done
        if (!isPlaying) return;

        // Increment index
        currentPlayIndex++;

        // Check for end of list
        if (currentPlayIndex >= filteredNames.length) {
            if (isLoopEnabled) {
                currentPlayIndex = 0;
            } else {
                stopAudio();
                return;
            }
        }

        // Recursively play next
        playCurrentAudio();
    });
}

function playNext(): void {
    currentPlayIndex++;
    if (currentPlayIndex >= filteredNames.length) currentPlayIndex = 0;
    playCurrentAudio();
    updatePlayerUI(); // Update UI immediately
}

function playPrev(): void {
    currentPlayIndex--;
    if (currentPlayIndex < 0) currentPlayIndex = filteredNames.length - 1;
    playCurrentAudio();
    updatePlayerUI();
}

function toggleLoop(): void {
    isLoopEnabled = !isLoopEnabled;
    const btn = document.getElementById('loopBtn');
    if (btn) btn.classList.toggle('active', isLoopEnabled);
}

function toggleSpeed(): void {
    // Cycle: 1 -> 0.75 -> 0.5 -> 1.5 -> 1
    if (playbackSpeed === 1.0) playbackSpeed = 0.75;
    else if (playbackSpeed === 0.75) playbackSpeed = 0.5;
    else if (playbackSpeed === 0.5) playbackSpeed = 1.5;
    else playbackSpeed = 1.0;

    const btn = document.getElementById('speedBtn');
    if (btn) btn.textContent = `${playbackSpeed}x`;

    // Update TTS rate?
    // TTSManager needs to support rate. 
    // For now we just control delay between names.
    // Ideally we should set TTS rate too.
}

function updatePlayerUI(): void {
    const playBtn = document.getElementById('playPauseBtn');
    const titleAr = document.getElementById('playerTitleAr');
    const titleSv = document.getElementById('playerTitleSv');
    const navBtn = document.getElementById('audioBtn');

    // Update bottom player button
    if (playBtn) playBtn.textContent = isPlaying ? '⏸️' : '▶️';

    // Update Nav Button Icon
    if (navBtn) {
        if (isPlaying) {
            navBtn.classList.add('playing');
            navBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>`; // Pause Icon
            navBtn.title = 'إيقاف مؤقت';
        } else {
            navBtn.classList.remove('playing');
            navBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>`; // Play Icon
            navBtn.title = 'تشغيل';
        }
    }

    if (playBtn) playBtn.textContent = isPlaying ? '⏸️' : '▶️';

    if (filteredNames[currentPlayIndex]) {
        if (titleAr) titleAr.textContent = filteredNames[currentPlayIndex].nameAr;
        if (titleSv) titleSv.textContent = filteredNames[currentPlayIndex].nameSv;
    }
}

// Close Audio Player and hide UI
function closeAudioPlayer(): void {
    stopAudio();
    const player = document.getElementById('audioPlayer');
    if (player) player.classList.add('hidden');
}

// Social Features
async function shareStats(): Promise<void> {
    const text = `🌟 إنجازي في أسماء الله الحسنى 🌟\n\n✅ حفظت: ${memorized.size} / 99 اسم\n❤️ المفضلة: ${favorites.size} اسم\n🔥 أيام متواصلة: ${streakDays} يوم\n\nتعلم أسماء الله الحسنى مع snabbaLexin!`;

    if (navigator.share) {
        try {
            await navigator.share({
                title: 'إنجازي في أسماء الله الحسنى',
                text: text,
            });
            return;
        } catch (e) {
            // Share failed silently
        }
    }

    // Fallback
    try {
        await navigator.clipboard.writeText(text);
        alert('تم نسخ النص إلى الحافظة! يمكنك مشاركته الآن.');
    } catch (e) {
        alert('عذراً، لم نتمكن من النسخ.');
    }
}

async function exportMemorizedList(): Promise<void> {
    if (memorized.size === 0) {
        alert('لم تقم بحفظ أي أسماء بعد.');
        return;
    }

    const list = allNames
        .filter(n => memorized.has(n.nr))
        .map(n => `${n.nr}. ${n.nameAr} (${n.meaningAr})`)
        .join('\n');

    const text = `📋 قائمة حفظي لأسماء الله الحسنى:\n\n${list}`;

    try {
        await navigator.clipboard.writeText(text);
        alert('تم نسخ قائمة الأسماء المحفوظة إلى الحافظة! 📋');
    } catch (e) {
        alert('عذراً، حدث خطأ في النسخ.');
    }
}

// DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    init();
    loadMobileView();
});

// Expose to window
(window as any).filterNames = filterNames;
(window as any).speakName = speakName;
(window as any).toggleTheme = toggleTheme;
(window as any).toggleMobileView = toggleMobileView;
(window as any).toggleFavorite = toggleFavorite;
(window as any).toggleMemorized = toggleMemorized;
(window as any).setFilter = setFilter;

// Toggle Player Repeat
function togglePlayerRepeat(): void {
    // Cycle 1 -> 3 -> 5 -> 7 -> 1
    const counts = [1, 3, 5, 7];
    const idx = counts.indexOf(repeatCount);
    // If current count is not in list (e.g. customized?), default to 0
    const currentIdx = idx === -1 ? 0 : idx;
    const nextIdx = (currentIdx + 1) % counts.length;
    setRepeatCount(counts[nextIdx]);
}

// Stats UI Updates
// ... (rest of stats code is fine, no changes needed, just adding this new function)

// Exports
// Toggle filters visibility
function toggleFilters(): void {
    const filterBar = document.getElementById('filterBar');
    if (filterBar) {
        filterBar.classList.toggle('show');
    }
}

// Quiz exports
// Quiz exports
(window as any).startQuiz = startQuiz;
(window as any).closeQuiz = closeQuiz;
(window as any).checkAnswer = checkAnswer;
(window as any).retryFillQuiz = initFillQuiz;
(window as any).checkAnswer = checkAnswer;

// Flashcard exports
(window as any).startFlashcards = startFlashcards;
(window as any).closeFlashcards = closeFlashcards;
(window as any).flipFlashcard = flipFlashcard;
(window as any).flashcardKnow = flashcardKnow;
(window as any).flashcardDontKnow = flashcardDontKnow;
(window as any).speakCurrentFlashcard = speakCurrentFlashcard;
(window as any).setRepeatCount = setRepeatCount;

(window as any).openStats = openStats;
(window as any).closeStats = closeStats;
(window as any).togglePlay = togglePlay;
(window as any).playNext = playNext;
(window as any).playPrev = playPrev;
(window as any).toggleLoop = toggleLoop;
(window as any).togglePlayerRepeat = togglePlayerRepeat;
(window as any).toggleSpeed = toggleSpeed;
(window as any).startAudio = startAudio;
(window as any).stopAudio = stopAudio;
(window as any).closeAudioPlayer = closeAudioPlayer;
(window as any).shareStats = shareStats;
(window as any).exportMemorizedList = exportMemorizedList;
(window as any).toggleLang = toggleLang;
(window as any).toggleFilters = toggleFilters;
(window as any).filterNames = applyFilters; // Export filterNames
(window as any).switchMode = switchMode;
(window as any).toggleCardExpansion = toggleCardExpansion;

document.addEventListener('DOMContentLoaded', () => {
    // Other init functions are called within their specific blocks or global scope?
    // It seems previous code might have relied on inline script? 
    // But since this is a module, we should init explicitly.
    loadTheme();
    loadLang();
    loadSavedState();
    loadMobileView();

    // Data Loading
    allNames = ASMA_UL_HUSNA;
    filteredNames = [...allNames];

    initViewManager();

    // Initialize Mode UI (simulate click on Browse to set indicator)
    switchMode('browse');

    // Initial Render
    renderCards();
    updateFilterCounts();
    createGoldenParticles();
});
