/**
 * Learn UI - Handles all learn page UI interactions
 */

import { lessonsData, Lesson, LessonSection, ExampleItem } from './learn/lessonsData';
import { TTSManager } from './tts';
import { LearnViewManager, LearnView, createLearnViewManager } from './learn/LearnViewManager';
import { debounce } from './performance-utils';
import { normalizeArabic } from './utils';

// Dictionary data is loaded globally via script
declare const dictionaryData: any[];

console.log('[LearnUI] Module loaded with', lessonsData.length, 'lessons');

// State
let currentFilter = 'all';
let currentLesson: Lesson | null = null;
let searchQuery = '';
let currentView: LearnView = 'browse';

// Gamification State
let xp = 0;
let level = 1;
let streak = 0;
let completedLessons: Set<string> = new Set();
let lastVisitDate = '';
let savedWords: Set<string> = new Set();

// Quiz State
let quizQuestions: any[] = [];
let currentQuestionIndex = 0;
let quizScore = 0;
let quizType: 'swe-to-arb' | 'arb-to-swe' = 'swe-to-arb';

// Flashcard State
let flashcardItems: any[] = [];
let currentFlashcardIndex = 0;
let isFlipped = false;

// Performance: Lazy Loading State
let visibleLessonsCount = 12;
const PAGE_SIZE = 12;
let scrollObserver: IntersectionObserver | null = null;

// XP Requirements per level
const XP_PER_LEVEL = 100;

// Load saved state
function loadState(): void {
    try {
        xp = parseInt(localStorage.getItem('learn_xp') || '0');
        level = parseInt(localStorage.getItem('learn_level') || '1');
        streak = parseInt(localStorage.getItem('learn_streak') || '0');
        lastVisitDate = localStorage.getItem('learn_last_visit') || '';

        const savedCompleted = localStorage.getItem('learn_completed');
        if (savedCompleted) {
            completedLessons = new Set(JSON.parse(savedCompleted));
        }

        calculateStreak();
    } catch (e) {
        console.error('[LearnUI] Failed to load state:', e);
    }
}

// Save state
function saveState(): void {
    localStorage.setItem('learn_xp', xp.toString());
    localStorage.setItem('learn_level', level.toString());
    localStorage.setItem('learn_streak', streak.toString());
    localStorage.setItem('learn_last_visit', lastVisitDate);
    localStorage.setItem('learn_completed', JSON.stringify([...completedLessons]));
}

// Calculate streak
function calculateStreak(): void {
    const today = new Date().toISOString().split('T')[0];

    if (lastVisitDate !== today) {
        if (lastVisitDate) {
            const lastDate = new Date(lastVisitDate);
            const currentDate = new Date(today);
            const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                streak++;
            } else if (diffDays > 1) {
                streak = 1;
            }
        } else {
            streak = 1;
        }

        lastVisitDate = today;
        saveState();
    }
}

// Add XP
function addXP(amount: number): void {
    xp += amount;

    // Check for level up
    const newLevel = Math.floor(xp / XP_PER_LEVEL) + 1;
    if (newLevel > level) {
        level = newLevel;
        showLevelUpAnimation();
    }

    saveState();
    // updateStatsUI(); // Removed - moved to profile-ui
}

// Show level up animation
function showLevelUpAnimation(): void {
    const levelBadge = document.querySelector('.level-badge');
    if (levelBadge) {
        levelBadge.classList.add('level-up');
        setTimeout(() => levelBadge.classList.remove('level-up'), 1000);
    }
}

// ========== VIEW MANAGER ==========
const viewManager = createLearnViewManager();

function initViewManager() {
    viewManager.registerViews({
        'browse': {
            viewId: 'browseView',
            onActivate: () => {
                console.log('[LearnUI] Browse View Activated');
                renderLessons();
            }
        },
        'quiz': {
            viewId: 'quizView',
            onActivate: () => {
                console.log('[LearnUI] Quiz View Activated');
                initQuiz();
            }
        },
        'flashcard': {
            viewId: 'flashcardView',
            onActivate: () => {
                console.log('[LearnUI] Flashcard View Activated');
                initFlashcards();
            }
        },
        'saved': {
            viewId: 'savedView',
            onActivate: () => {
                console.log('[LearnUI] Saved View Activated');
                renderSavedLessons();
            }
        }
    });
}

function switchMode(mode: string) {
    viewManager.switchTo(mode as LearnView);

    // Update Mode Bar UI
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    const btnId = `btn-${mode}`;
    const activeBtn = document.getElementById(btnId);

    if (activeBtn) {
        activeBtn.classList.add('active');
        updateModeIndicator(activeBtn);
    }
}

function updateModeIndicator(activeBtn: HTMLElement) {
    const indicator = document.getElementById('modeIndicator');
    const bar = document.getElementById('modeSelectionBar');
    if (!indicator || !bar) return;

    const barRect = bar.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    // Calculate offset relative to the bar
    const offsetLeft = btnRect.left - barRect.left;

    indicator.style.width = `${btnRect.width}px`;
    indicator.style.transform = `translateX(${offsetLeft - 6}px)`; // -6px for padding offset
}

// ========== QUIZ LOGIC ==========

function initQuiz() {
    console.log('[LearnUI] Initializing Quiz...');
    const container = document.getElementById('quizContent');
    if (!container) return;

    // Fast Render: Show Loading State Immediately
    container.innerHTML = `
        <div class="empty-state">
            <div class="spinner"></div> <!-- Ensure you have CSS for this or use simple text -->
            <p>Laddar quiz...</p>
        </div>
    `;

    // Defer Heavy Calculation to next tick
    setTimeout(() => {
        // Reset State
        quizScore = 0;
        currentQuestionIndex = 0;

        // Generate Questions from lessonsData
        quizQuestions = generateQuizQuestions();

        if (quizQuestions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p class="sv-text">Inga frågor tillgängliga än.</p>
                    <p class="ar-text">لا توجد أسئلة متاحة بعد.</p>
                    <button class="retry-btn" onclick="switchMode('browse')">Tillbaka / رجوع</button>
                </div>
            `;
            return;
        }

        showQuestion();
    }, 50);
}

function generateQuizQuestions() {
    const allExamples: ExampleItem[] = [];
    lessonsData.forEach(lesson => {
        lesson.sections.forEach(section => {
            allExamples.push(...section.examples);
        });
    });

    // Shuffle and pick 10
    const shuffled = [...allExamples].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);

    return selected.map(ex => {
        const isSweToArb = Math.random() > 0.5;

        // Generate options
        const otherExamples = allExamples.filter(e => e.swe !== ex.swe);
        const distractors = [...otherExamples]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(e => isSweToArb ? e.arb : e.swe);

        const options = [...distractors, isSweToArb ? ex.arb : ex.swe].sort(() => Math.random() - 0.5);

        return {
            question: isSweToArb ? ex.swe : ex.arb,
            answer: isSweToArb ? ex.arb : ex.swe,
            options: options,
            type: isSweToArb ? 'swe-to-arb' : 'arb-to-swe',
            example: ex
        };
    });
}

function showQuestion() {
    const container = document.getElementById('quizContent');
    if (!container || !quizQuestions[currentQuestionIndex]) return;

    const q = quizQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / quizQuestions.length) * 100;

    container.innerHTML = `
        <div class="quiz-header">
            <div class="quiz-progress-bar">
                <div class="quiz-progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="quiz-stats">
                <span>Fråga ${currentQuestionIndex + 1}/${quizQuestions.length}</span>
                <span>Poäng: ${quizScore}</span>
            </div>
        </div>

        <div class="question-card">
            <div class="question-label">${q.type === 'swe-to-arb' ? 'Översätt till arabiska:' : 'Översätt till svenska:'}</div>
            <div class="question-text ${q.type === 'arb-to-swe' ? 'ar-text' : 'sv-text'}" dir="${q.type === 'arb-to-swe' ? 'rtl' : 'ltr'}">
                ${q.question}
            </div>
        </div>

        <div class="options-grid">
            ${q.options.map((opt: string) => `
                <button class="option-btn ${q.type === 'swe-to-arb' ? 'ar-text' : 'sv-text'}" 
                        onclick="checkAnswer('${opt.replace(/'/g, "\\'")}')" 
                        dir="${q.type === 'swe-to-arb' ? 'rtl' : 'ltr'}">
                    ${opt}
                </button>
            `).join('')}
        </div>
    `;

    // Parse emojis
    if (typeof (window as any).twemoji !== 'undefined') {
        (window as any).twemoji.parse(container, { folder: 'svg', ext: '.svg' });
    }
}

function checkAnswer(selected: string) {
    const q = quizQuestions[currentQuestionIndex];
    const options = document.querySelectorAll('.option-btn');

    options.forEach(btn => {
        const btnText = (btn as HTMLElement).textContent?.trim();
        if (btnText === q.answer) {
            btn.classList.add('correct');
        } else if (btnText === selected && selected !== q.answer) {
            btn.classList.add('wrong');
        }
        (btn as HTMLButtonElement).disabled = true;
    });

    if (selected === q.answer) {
        quizScore++;
        addXP(5);
    }

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizQuestions.length) {
            showQuestion();
        } else {
            showQuizResults();
        }
    }, 1500);
}

function showQuizResults() {
    const container = document.getElementById('quizContent');
    if (!container) return;

    const percentage = (quizScore / quizQuestions.length) * 100;

    container.innerHTML = `
        <div class="quiz-results">
            <div class="result-icon">${percentage >= 70 ? '🎉' : '💪'}</div>
            <h2>Quiz klart!</h2>
            <div class="result-score">${quizScore} / ${quizQuestions.length}</div>
            <p>${percentage >= 70 ? 'Bra jobbat! Du börjar behärska detta.' : 'Bra försök! Fortsätt öva så kommer du snart ihåg allt.'}</p>
            
            <div class="result-actions">
                <button class="primary-btn" onclick="initQuiz()">Försök igen / حاول مرة أخرى</button>
                <button class="secondary-btn" onclick="switchMode('browse')">Klar / تم</button>
            </div>
        </div>
    `;
}

// ========== FLASHCARD LOGIC ==========
function initFlashcards() {
    console.log('[LearnUI] Initializing Flashcards...');
    const container = document.getElementById('flashcardContent');
    if (!container) return;

    // Fast Render: Loading State
    container.innerHTML = `
        <div class="empty-state">
            <p>Blandar kort...</p>
        </div>
    `;

    // Defer Heavy Logic
    setTimeout(() => {
        // Grab all examples
        const allExamples: ExampleItem[] = [];
        lessonsData.forEach(lesson => {
            lesson.sections.forEach(section => {
                allExamples.push(...section.examples);
            });
        });

        // Shuffle
        flashcardItems = [...allExamples].sort(() => Math.random() - 0.5).slice(0, 15);
        currentFlashcardIndex = 0;
        isFlipped = false;

        if (flashcardItems.length === 0) {
            container.innerHTML = `<div class="empty-state">Inga exempel att visa.</div>`;
            return;
        }

        showFlashcard();
    }, 50);
}

function showFlashcard() {
    const container = document.getElementById('flashcardContent');
    if (!container) return;

    const item = flashcardItems[currentFlashcardIndex];
    const progress = ((currentFlashcardIndex + 1) / flashcardItems.length) * 100;

    container.innerHTML = `
        <div class="flashcard-header">
            <div class="quiz-progress-bar">
                <div class="quiz-progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="flashcard-counter">${currentFlashcardIndex + 1} / ${flashcardItems.length}</div>
        </div>

        <div class="flashcard-wrapper ${isFlipped ? 'flipped' : ''}" onclick="flipFlashcard()">
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <div class="flashcard-label">Svenska</div>
                    <div class="flashcard-text sv-text">${item.swe}</div>
                    <div class="flashcard-hint">Klicka för att vända / انقر للقلب</div>
                </div>
                <div class="flashcard-back">
                    <div class="flashcard-label">Arabiska / العربية</div>
                    <div class="flashcard-text ar-text" dir="rtl">${item.arb}</div>
                    <div class="flashcard-hint">Klicka för att vända / انقر للقلب</div>
                </div>
            </div>
        </div>

        <div class="flashcard-controls">
            <button class="dont-know-btn" onclick="nextFlashcard(false)">
                ❌ <span class="sv-text">Kan inte</span><span class="ar-text">لا أعرف</span>
            </button>
            <button class="know-btn" onclick="nextFlashcard(true)">
                ✅ <span class="sv-text">Kan!</span><span class="ar-text">أعرفها</span>
            </button>
        </div>
    `;
}

function flipFlashcard() {
    isFlipped = !isFlipped;
    const wrapper = document.querySelector('.flashcard-wrapper');
    if (wrapper) {
        wrapper.classList.toggle('flipped', isFlipped);
    }
}

function nextFlashcard(known: boolean) {
    if (known) addXP(2);

    currentFlashcardIndex++;
    isFlipped = false;

    if (currentFlashcardIndex < flashcardItems.length) {
        showFlashcard();
    } else {
        finishFlashcards();
    }
}

function finishFlashcards() {
    const container = document.getElementById('flashcardContent');
    if (!container) return;

    container.innerHTML = `
        <div class="quiz-results">
            <div class="result-icon">🎓</div>
            <h2>Flashcards klara!</h2>
            <p>Du har gått igenom ${flashcardItems.length} kort.</p>
            <div class="result-actions">
                <button class="primary-btn" onclick="initFlashcards()">Börja om / ابدأ من جديد</button>
                <button class="secondary-btn" onclick="switchMode('browse')">Klar / تم</button>
            </div>
        </div>
    `;
}

// ========== SAVED LOGIC ==========
function renderSavedLessons() {
    console.log('[LearnUI] Rendering Saved Lessons...');
    const container = document.getElementById('savedList');
    if (!container) return;

    // Clear current content
    container.innerHTML = '';

    const completed = lessonsData.filter(l => completedLessons.has(l.id));

    if (completed.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p class="sv-text">Du har inte slutfört några lektioner än.</p>
                <p class="ar-text">لم تكمل أي دروس بعد.</p>
            </div>
        `;
        return;
    }

    // Optimization: Use DocumentFragment to batch DOM insertions
    const fragment = document.createDocumentFragment();

    // Process in chunks if too large (e.g. > 50 items), for now generic optimization is enough
    completed.forEach(lesson => {
        // Create a temporary container to parse the HTML string
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = createLessonCardHTML(lesson);
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }
    });

    container.appendChild(fragment);

    // Helper: Parse emojis after render
    requestAnimationFrame(() => {
        if (typeof (window as any).twemoji !== 'undefined') {
            (window as any).twemoji.parse(container, { folder: 'svg', ext: '.svg' });
        }
    });
}

// Render lessons grid
// Render lessons grid with Lazy Loading
function renderLessons(append = false): void {
    const grid = document.getElementById('lessonsGrid');
    if (!grid) {
        console.error('[LearnUI] Lessons grid not found');
        return;
    }

    let filteredLessons = lessonsData;

    // Apply filters
    if (currentFilter !== 'all') {
        filteredLessons = lessonsData.filter(l => l.level === currentFilter);
    }

    // Apply deep search
    if (searchQuery) {
        const query = searchQuery.toLowerCase().trim();
        const cleanQuery = normalizeArabic(query);

        filteredLessons = filteredLessons.filter(l => {
            // 1. Search in Title or ID
            if (l.title.toLowerCase().includes(query) || l.id.toLowerCase().includes(query)) return true;

            // 2. Deep Search in Sections and Examples
            return l.sections.some(section => {
                // Search in Section Title
                if (section.title.toLowerCase().includes(query)) return true;

                // Search in Content Items (HTML text)
                if (section.content.some(c => c.html.toLowerCase().includes(query))) return true;

                // Search in Examples (Deepest Level)
                return section.examples.some(ex => {
                    const cleanSwe = ex.swe.toLowerCase();
                    const cleanArb = normalizeArabic(ex.arb);
                    return cleanSwe.includes(query) || cleanArb.includes(cleanQuery);
                });
            });
        });
    }

    // Pagination Logic
    if (!append) {
        // Reset
        visibleLessonsCount = PAGE_SIZE;
        grid.innerHTML = '';
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Slice for this batch
    // If appending, we want indices from [currentCount] to [currentCount + PAGE_SIZE]
    // But wait, 'visibleLessonsCount' tracks TOTAL rendered.
    // simpler:
    const startIndex = append ? (visibleLessonsCount) : 0;
    if (append) {
        visibleLessonsCount += PAGE_SIZE;
    }
    const endIndex = visibleLessonsCount;

    const lessonsToShow = filteredLessons.slice(startIndex, endIndex);

    if (lessonsToShow.length === 0 && append) return; // End reached

    console.log(`[LearnUI] Rendering batch ${startIndex}-${endIndex} (Total: ${filteredLessons.length})`);

    const html = lessonsToShow.map(lesson => createLessonCardHTML(lesson)).join('');

    // Append Sentinel Logic
    if (append) {
        // Remove old sentinel
        const oldSentinel = document.getElementById('lessons-sentinel');
        if (oldSentinel) oldSentinel.remove();

        grid.insertAdjacentHTML('beforeend', html);
    } else {
        grid.innerHTML = html;
    }

    // Add Sentinel if more items exist
    if (endIndex < filteredLessons.length) {
        const sentinel = document.createElement('div');
        sentinel.id = 'lessons-sentinel';
        sentinel.style.height = '50px';
        sentinel.style.width = '100%';
        // sentinel.style.background = 'red'; // Debug
        grid.appendChild(sentinel);

        if (scrollObserver) scrollObserver.observe(sentinel);
    }

    // Defer non-critical Twemoji parsing
    requestAnimationFrame(() => {
        if (typeof (window as any).twemoji !== 'undefined') {
            (window as any).twemoji.parse(grid, { folder: 'svg', ext: '.svg' });
        }
    });
}


// Create lesson card HTML
function createLessonCardHTML(lesson: Lesson): string {
    const isCompleted = completedLessons.has(lesson.id);
    const levelColors: Record<string, string> = {
        'beginner': '#22c55e',
        'intermediate': '#eab308',
        'advanced': '#ef4444'
    };
    const levelEmoji: Record<string, string> = {
        'beginner': '🟢',
        'intermediate': '🟡',
        'advanced': '🔴'
    };

    // Mastery Stars - Only show if completed
    let starsHtml = '';
    if (isCompleted) {
        starsHtml = `
            <div class="mastery-stars">
                <span class="star active">★</span>
                <span class="star active">★</span>
                <span class="star active">★</span>
            </div>
        `;
    }

    // Layout matching 'Results Card' style from main App
    const tFn = (window as any).t;
    const rawLabel = tFn ? tFn('learn.sections') : 'avsnitt';
    // If translation is missing (returns key) or empty, use fallback
    const sectionLabel = (rawLabel === 'learn.sections' || !rawLabel) ? 'avsnitt' : rawLabel;

    const sectionsText = `${lesson.sections.length} ${sectionLabel}`;
    const timeText = `${Math.max(3, lesson.sections.length * 2)} min`;

    // Arabic title or description if available
    const subTitle = lesson.id === 'wordOrder' ? 'ترتيب الكلمات - قاعدة V2' :
        lesson.id === 'verbs' ? 'الأفعال والأزمنة' :
            lesson.id === 'pronouns' ? 'الضمائر الشخصية' :
                lesson.id === 'adjectives' ? 'الصفات - التذكير والتأنيث' : 'درس قواعد';

    return `
        <div class="lesson-card search-result-style ${isCompleted ? 'completed' : ''}" 
             onclick="openLesson('${lesson.id}')" 
             data-level="${lesson.level}"
             onmousemove="handleCardTilt(event, this)"
             onmouseleave="resetCardTilt(this)">
             
            <div class="lesson-card-header">
                <div class="lesson-text-group">
                    <h2 class="lesson-title search-result-title">${lesson.title}</h2>
                    <span class="lesson-level-badge ${lesson.level}">${levelEmoji[lesson.level] || '📚'} ${lesson.level}</span>
                </div>
                ${isCompleted ? '<span class="check-icon">✓</span>' : ''}
            </div>
            
            <p class="lesson-subtitle-arb" dir="rtl">${subTitle}</p>
            
            <div class="lesson-meta-row">
                <span class="meta-item"><span class="icon">📄</span> ${sectionsText}</span>
                <span class="meta-item"><span class="icon">⚡</span> ${timeText}</span>
            </div>

            ${starsHtml}

            <div class="lesson-progress-bar">
                <div class="lesson-progress-fill" style="width: ${isCompleted ? '100' : '0'}%"></div>
            </div>
        </div>
    `;
}

// 3D Tilt Effect
// 3D Tilt Effect - Optimized to avoid layout thrashing
// 3D Tilt Effect - Optimized to avoid layout thrashing
let tiltRect: DOMRect | null = null;
let activeCard: HTMLElement | null = null;

// Handle window resize to prevent stale coordinates
window.addEventListener('resize', () => {
    tiltRect = null;
    activeCard = null;
});

function handleCardTilt(e: MouseEvent, card: HTMLElement) {
    if (activeCard !== card) {
        // Cache rect only when entering a new card
        tiltRect = card.getBoundingClientRect();
        activeCard = card;
    }

    if (!tiltRect) return;

    // Use cached rect
    const x = e.clientX - tiltRect.left;
    const y = e.clientY - tiltRect.top;

    requestAnimationFrame(() => {
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);

        const centerX = tiltRect!.width / 2;
        const centerY = tiltRect!.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });
}

function resetCardTilt(card: HTMLElement) {
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    activeCard = null;
    tiltRect = null;
}

// Open lesson
function openLesson(lessonId: string): void {
    const lesson = lessonsData.find(l => l.id === lessonId);
    if (!lesson) return;

    currentLesson = lesson;

    const modal = document.getElementById('lessonModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('lessonContent');

    if (modal) modal.classList.add('active');
    if (title) title.textContent = lesson.title;

    if (content) {
        content.innerHTML = renderLessonContent(lesson);
    }

    // Add XP for opening lesson
    addXP(5);
}

// Render lesson content
function renderLessonContent(lesson: Lesson): string {
    return `
        <div class="lesson-sections">
            ${lesson.sections.map((section, index) => `
                <div class="lesson-section" data-section="${index}">
                    <h3 class="section-title">${section.title}</h3>
                    
                    ${section.content.map(item => `
                        <div class="content-item ${item.type}">
                            ${item.html}
                        </div>
                    `).join('')}
                    
                    ${section.examples.length > 0 ? `
                        <div class="examples-list">
                            ${section.examples.slice(0, 10).map(ex => `
                                <div class="example-item">
                                    <div class="example-swe">
                                        <button class="speak-btn" onclick="speakText('${ex.swe.replace(/'/g, "\\'")}', 'sv')">🔊</button>
                                        ${ex.swe}
                                    </div>
                                    <div class="example-arb">${ex.arb}</div>
                                </div>
                            `).join('')}
                            ${section.examples.length > 10 ? `
                                <button class="show-more-btn" onclick="this.parentElement.classList.add('expanded'); this.remove();">
                                    Visa ${section.examples.length - 10} till...
                                </button>
                                <div class="more-examples">
                                    ${section.examples.slice(10).map(ex => `
                                        <div class="example-item">
                                            <div class="example-swe">
                                                <button class="speak-btn" onclick="speakText('${ex.swe.replace(/'/g, "\\'")}', 'sv')">🔊</button>
                                                ${ex.swe}
                                            </div>
                                            <div class="example-arb">${ex.arb}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}

            <div class="lesson-actions">
                <button class="complete-lesson-btn" onclick="completeLesson('${lesson.id}')">
                    ✅ <span class="sv-text">Markera som klar</span><span class="ar-text">اكتمل</span>
                </button>
            </div>
        </div>
    `;
}

// Complete lesson
function completeLesson(lessonId: string): void {
    if (!completedLessons.has(lessonId)) {
        completedLessons.add(lessonId);
        addXP(20);
        saveState();
        renderLessons();
    }
    closeLessonModal();
}

// Close lesson modal
function closeLessonModal(): void {
    const modal = document.getElementById('lessonModal');
    if (modal) modal.classList.remove('active');
    currentLesson = null;
}

// Speak text
function speakText(text: string, lang: string): void {
    if (typeof TTSManager !== 'undefined' && TTSManager) {
        TTSManager.speak(text, lang);
    } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'sv' ? 'sv-SE' : 'ar-SA';
        speechSynthesis.speak(utterance);
    }
}

// Setup filter chips
function setupFilters(): void {
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.getAttribute('data-filter') || 'all';
            renderLessons();
        });
    });
}

// Setup search
function setupSearch(): void {
    const searchInput = document.getElementById('lessonSearchInput') as HTMLInputElement;
    if (searchInput) {
        // Debounce search to avoid lag while typing
        const debouncedRender = debounce(() => {
            searchQuery = searchInput.value;
            renderLessons();
        }, 300);

        searchInput.addEventListener('input', debouncedRender);
    }

    // Filter Toggle Logic
    const filterBtn = document.getElementById('filterToggleBtn');
    const filterContainer = document.querySelector('.filter-scroll-container');

    if (filterBtn && filterContainer) {
        filterBtn.addEventListener('click', () => {
            const isExpanded = filterContainer.classList.contains('expanded');

            if (isExpanded) {
                filterContainer.classList.remove('expanded');
                filterBtn.classList.remove('active');
            } else {
                filterContainer.classList.add('expanded');
                filterBtn.classList.add('active');
            }
        });
    }
}

// Open random quiz
function openRandomQuiz(): void {
    console.log('[LearnUI] Opening random quiz...');
    // Select a random lesson and quiz from it
    const randomLesson = lessonsData[Math.floor(Math.random() * lessonsData.length)];
    openLesson(randomLesson.id);
}

// Open daily challenge
function openDailyChallenge(): void {
    console.log('[LearnUI] Opening daily challenge...');
    // Open random lesson for now
    openRandomQuiz();
    addXP(10);
}

// Speak Word of the Day
function speakWordOfDay(): void {
    const wodWord = document.getElementById('wodWord');
    const wodExample = document.getElementById('wodExampleSwe');

    if (wodWord) {
        speakText(wodWord.textContent || '', 'sv');
        // Speak example after a short delay
        if (wodExample) {
            setTimeout(() => {
                speakText(wodExample.textContent || '', 'sv');
            }, 1500);
        }
    }
}

// Set path filter
function setPathFilter(filterLevel: string): void {
    // Update UI chips
    const chips = document.querySelectorAll('.filter-chip');
    chips.forEach(chip => {
        if (chip.getAttribute('data-filter') === filterLevel) {
            chip.classList.add('active');
        } else {
            chip.classList.remove('active');
        }
    });

    currentFilter = filterLevel;
    renderLessons();

    // Scroll to lessons section
    const lessonsSection = document.getElementById('lessonsGrid');
    if (lessonsSection) {
        lessonsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Open review session
function openReviewSession(): void {
    console.log('[LearnUI] Opening review session...');
    // For now, open a random quiz
    openRandomQuiz();
}

// Export to window
function exportToWindow(): void {
    (window as any).openLesson = openLesson;
    (window as any).closeLessonModal = closeLessonModal;
    (window as any).completeLesson = completeLesson;
    (window as any).speakText = speakText;
    (window as any).openRandomQuiz = openRandomQuiz;
    (window as any).openDailyChallenge = openDailyChallenge;
    (window as any).speakWordOfDay = speakWordOfDay;
    (window as any).setPathFilter = setPathFilter;
    (window as any).openReviewSession = openReviewSession;
    (window as any).handleCardTilt = handleCardTilt;
    (window as any).resetCardTilt = resetCardTilt;
    (window as any).switchMode = switchMode;
    (window as any).initQuiz = initQuiz;
    (window as any).checkAnswer = checkAnswer;
    (window as any).flipFlashcard = flipFlashcard;
    (window as any).nextFlashcard = nextFlashcard;
}

// Initialize Word of the Day (Random on each page load)
async function initWordOfDay(): Promise<void> {
    const wodWord = document.getElementById('wodWord');
    const wodTranslation = document.getElementById('wodTranslation');
    const wodExampleSwe = document.getElementById('wodExampleSwe');
    const wodExampleArb = document.getElementById('wodExampleArb');
    const wodCategory = document.querySelector('.wod-category');
    const wodDate = document.getElementById('wodDate');

    if (!wodWord) return;

    // Use DictionaryDB
    try {
        // Import dynamically to avoid top-level await issues if not supported
        const { DictionaryDB } = await import('./db');

        // Wait for DB init
        await DictionaryDB.init();

        const word = await DictionaryDB.getRandomWord();

        if (word) {
            console.log('[LearnUI] Word of the Day:', word.swedish);

            if (wodWord) wodWord.textContent = word.swedish;
            if (wodTranslation) wodTranslation.textContent = word.arabic;

            // Find an example if available, or create a fallback
            const exampleSwe = word.example || `${word.swedish} är ett bra ord.`;
            const exampleArb = word.example_ar || `كلمة ${word.arabic} كلمة جيدة.`;

            if (wodExampleSwe) wodExampleSwe.textContent = exampleSwe;
            if (wodExampleArb) wodExampleArb.textContent = exampleArb;

            if (wodCategory) wodCategory.textContent = `🏷️ ${word.type || 'Ord'}`;
        } else {
            console.warn('[LearnUI] No words found in DB for Word of the Day');
            if (wodWord) wodWord.textContent = 'Välkommen';
            if (wodTranslation) wodTranslation.textContent = 'مرحباً';
        }

    } catch (e) {
        console.error('[LearnUI] Failed to load Word of the Day:', e);
    }

    // Format date: "30 December"
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    if (wodDate) wodDate.textContent = today.toLocaleDateString('sv-SE', options);
}

// Initialize
export function initLearnUI(): void {
    console.log('[LearnUI] Initializing...');

    loadState();
    initViewManager();
    exportToWindow();
    setupFilters();
    setupSearch();
    initScrollObserver();
    renderLessons();
    // updateStatsUI(); // Removed
    initWordOfDay();

    console.log('[LearnUI] Initialized successfully');
}

// Initialize Intersection Observer for Infinite Scroll
function initScrollObserver() {
    if (scrollObserver) scrollObserver.disconnect();

    scrollObserver = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
            // Load more
            requestAnimationFrame(() => {
                renderLessons(true);
            });
        }
    }, {
        root: null, // viewport
        rootMargin: '300px', // Load before reaching bottom
        threshold: 0.1
    });
}

// Add CSS for lesson cards
const style = document.createElement('style');
style.textContent = `
    /* --- Premium Lesson Card Styling --- */
    .lesson-card {
        display: flex;
        flex-direction: column;
        align-items: flex-start; /* Force children to left */
        text-align: left;        /* Force text to left */
        background: rgba(30, 41, 59, 0.7);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 1.5rem;
        cursor: pointer;
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), 
                    box-shadow 0.4s ease, 
                    border-color 0.3s ease;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transform-style: preserve-3d;
    }
    
    .lesson-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
                                  rgba(96, 165, 250, 0.15) 0%, 
                                  transparent 50%);
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
        z-index: 1;
    }

    .lesson-card:hover::before {
        opacity: 1;
    }
    
    .lesson-card:hover {
        transform: translateY(-5px) scale(1.01);
        box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.2), 
                    0 0 15px rgba(96, 165, 250, 0.1);
        border-color: rgba(96, 165, 250, 0.3);
    }
    
    .lesson-card.completed {
        border-color: rgba(34, 197, 94, 0.4);
        background: linear-gradient(145deg, rgba(34, 197, 94, 0.05), rgba(30, 41, 59, 0.7));
    }

    /* Mastery Stars */
    .mastery-stars {
        display: flex;
        gap: 4px;
        margin-top: 8px;
        justify-content: center;
    }

    .star {
        font-size: 1.1rem;
        color: #475569;
        transition: color 0.3s, transform 0.3s;
    }

    .star.active {
        color: #fbbf24;
        filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.5));
        animation: starPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes starPop {
        50% { transform: scale(1.4); }
    }

    /* Neon Progress */
    .lesson-progress-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        overflow: visible;
        margin-top: 12px;
        position: relative;
    }
    
    .lesson-progress-fill {
        height: 100%;
        background: #60a5fa;
        border-radius: 4px;
        transition: width 0.5s ease;
        position: relative;
        box-shadow: 0 0 10px rgba(96, 165, 250, 0.8);
    }
    
    .lesson-card.completed .lesson-progress-fill {
        background: #22c55e;
        box-shadow: 0 0 10px rgba(34, 197, 94, 0.8);
    }
    
    /* --- Search Result Style Layout --- */
    .lesson-card-header {
        display: flex;
        justify-content: space-between; /* Push checkmark to right */
        align-items: flex-start;
        margin-bottom: 1rem;
        width: 100%; /* Ensure header takes full width */
    }

    .lesson-text-group {
        display: flex;
        flex-direction: column;
        align-items: flex-start; /* Align Title and Badge to Left */
        gap: 0.5rem;
        flex: 1; /* Take available space */
        min-width: 0; /* Prevent overflow issues */
    }

    .lesson-title.search-result-title {
        font-size: 1.3rem; 
        font-weight: 700;
        color: #f8fafc;
        margin: 0;
        line-height: 1.2;
        width: 100%;
        white-space: nowrap;       /* Keep text on one line */
        overflow: hidden;          /* Hide overflow */
        text-overflow: ellipsis;   /* Add ... if too long */
        text-align: left;          /* Force left alignment */
    }

    .lesson-level-badge {
        font-size: 0.75rem;
        padding: 2px 8px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.1);
        color: #cbd5e1;
        width: fit-content;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        text-transform: capitalize;
    }

    .lesson-subtitle-arb {
        color: #94a3b8;
        font-size: 0.95rem;
        margin-bottom: 1rem;
        font-family: 'Tajawal', sans-serif;
    }

    .lesson-meta-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .meta-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #64748b;
        font-size: 0.85rem;
        background: rgba(15, 23, 42, 0.4);
        padding: 4px 10px;
        border-radius: 8px;
    }
    
    .meta-item .icon {
        opacity: 0.8;
    }

    .check-icon {
        color: #4ade80;
        font-weight: bold;
        background: rgba(74, 222, 128, 0.1);
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }

    /* Lesson Modal Styles */
    .lesson-sections {
        padding-bottom: 2rem;
    }
    
    .lesson-section {
        background: rgba(30, 41, 59, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }
    
    .section-title {
        color: #60a5fa;
        font-size: 1.2rem;
        margin-bottom: 1rem;
    }
    
    .content-item {
        color: #e2e8f0;
        line-height: 1.8;
        margin-bottom: 1rem;
    }
    
    .examples-list {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }
    
    .example-item {
        background: rgba(15, 23, 42, 0.6);
        border-radius: 12px;
        padding: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    .example-swe {
        color: #e2e8f0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.3rem;
    }
    
    .example-arb {
        color: #94a3b8;
        direction: rtl;
        text-align: right;
        font-size: 0.9rem;
    }
    
    .speak-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        opacity: 0.7;
        transition: opacity 0.2s;
    }
    
    .speak-btn:hover {
        opacity: 1;
    }
    
    .show-more-btn {
        background: rgba(96, 165, 250, 0.2);
        border: 1px solid rgba(96, 165, 250, 0.3);
        color: #60a5fa;
        padding: 0.8rem;
        border-radius: 12px;
        cursor: pointer;
        width: 100%;
        font-size: 0.9rem;
        transition: all 0.3s;
    }
    
    .show-more-btn:hover {
        background: rgba(96, 165, 250, 0.3);
    }
    
    .more-examples {
        display: none;
    }
    
    .examples-list.expanded .more-examples {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }
    
    .complete-lesson-btn {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border: none;
        color: white;
        padding: 1rem 2rem;
        border-radius: 16px;
        font-size: 1rem;
        cursor: pointer;
        width: 100%;
        margin-top: 1rem;
        transition: all 0.3s;
    }
    
    .complete-lesson-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(34, 197, 94, 0.3);
    }
    
    .lesson-actions {
        margin-top: 2rem;
    }
    
    @keyframes levelUp {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
    }

    /* --- Mode selection bar --- */
    .mode-selection-bar {
        display: flex;
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        margin: 1rem;
        padding: 4px;
        border-radius: 20px;
        position: relative;
        border: 1px solid rgba(255, 255, 255, 0.05);
        z-index: 10;
    }

    .mode-btn {
        flex: 1;
        background: none;
        border: none;
        padding: 0.8rem 0.5rem;
        border-radius: 16px;
        color: #94a3b8;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        position: relative;
        z-index: 2;
        transition: color 0.3s;
    }

    .mode-btn.active {
        color: #fbbf24;
    }

    .mode-icon {
        font-size: 1.2rem;
    }

    .mode-label {
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .mode-indicator {
        position: absolute;
        bottom: 4px;
        top: 4px;
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.05));
        border: 1px solid rgba(251, 191, 36, 0.3);
        border-radius: 16px;
        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        z-index: 1;
    }

    /* --- View Sections --- */
    .view-section {
        display: none;
    }
    .view-section.active {
        display: block;
        animation: viewIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes viewIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* --- Quiz Styles --- */
    .quiz-container {
        padding: 1rem;
        max-width: 600px;
        margin: 0 auto;
    }
    .quiz-progress-bar {
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 0.5rem;
    }
    .quiz-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #fbbf24, #f59e0b);
        border-radius: 10px;
        transition: width 0.4s ease;
        box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
    }
    .quiz-stats {
        display: flex;
        justify-content: space-between;
        color: #94a3b8;
        font-size: 0.85rem;
        margin-bottom: 2rem;
    }
    .question-card {
        background: rgba(30, 41, 59, 0.7);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-radius: 28px;
        padding: 3rem 2rem;
        text-align: center;
        margin-bottom: 2rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
    }
    .question-label {
        color: #60a5fa;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 2px;
        margin-bottom: 1.5rem;
        opacity: 0.8;
    }
    .question-text {
        font-size: 2rem;
        font-weight: 800;
        color: #f8fafc;
        line-height: 1.4;
    }
    .options-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.2rem;
    }
    .option-btn {
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 1.5rem 1rem;
        border-radius: 20px;
        color: #e2e8f0;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .option-btn:hover:not(:disabled) {
        transform: translateY(-3px);
        background: rgba(96, 165, 250, 0.1);
        border-color: #60a5fa;
        box-shadow: 0 10px 15px rgba(0, 0, 0, 0.2);
    }
    .option-btn:active:not(:disabled) { transform: scale(0.95); }
    .option-btn.correct {
        background: rgba(34, 197, 94, 0.2) !important;
        border-color: #22c55e !important;
        color: #4ade80 !important;
        box-shadow: 0 0 15px rgba(34, 197, 94, 0.3);
    }
    .option-btn.wrong {
        background: rgba(239, 68, 68, 0.2) !important;
        border-color: #ef4444 !important;
        color: #f87171 !important;
        box-shadow: 0 0 15px rgba(239, 68, 68, 0.3);
    }

    /* --- Flashcard Styles --- */
    .flashcard-container {
        padding: 1rem;
        max-width: 500px;
        margin: 0 auto;
    }
    .flashcard-header { margin-bottom: 2rem; }
    .flashcard-wrapper {
        perspective: 1200px;
        height: 400px;
        width: 100%;
        margin-bottom: 3rem;
        cursor: pointer;
    }
    .flashcard-inner {
        position: relative;
        width: 100%;
        height: 100%;
        text-align: center;
        transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        transform-style: preserve-3d;
    }
    .flashcard-wrapper.flipped .flashcard-inner {
        transform: rotateY(180deg);
    }
    .flashcard-front, .flashcard-back {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(30, 41, 59, 0.8);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 2px solid rgba(251, 191, 36, 0.15);
        border-radius: 40px;
        padding: 3rem 2rem;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
    .flashcard-back {
        transform: rotateY(180deg);
        border-color: rgba(96, 165, 250, 0.2);
    }
    .flashcard-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 3px;
        color: #94a3b8;
        margin-bottom: 2rem;
    }
    .flashcard-text {
        font-size: 2.2rem;
        font-weight: 800;
        color: #f8fafc;
        line-height: 1.3;
    }
    .flashcard-hint {
        font-size: 0.8rem;
        color: #64748b;
        margin-top: 2rem;
        font-style: italic;
    }
    .flashcard-controls {
        display: flex;
        gap: 1.5rem;
    }
    .flashcard-controls button {
        flex: 1;
        padding: 1.2rem;
        border-radius: 20px;
        border: none;
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.8rem;
    }
    .flashcard-controls button:hover { transform: translateY(-3px); }
    .flashcard-controls button:active { transform: scale(0.95); }
    
    .dont-know-btn { 
        background: rgba(239, 68, 68, 0.15); 
        color: #f87171; 
        border: 1px solid rgba(239, 68, 68, 0.25) !important; 
    }
    .know-btn { 
        background: rgba(34, 197, 94, 0.15); 
        color: #4ade80; 
        border: 1px solid rgba(34, 197, 94, 0.25) !important; 
    }
    
    .flashcard-counter {
        text-align: center;
        margin-top: 1rem;
        color: #64748b;
        font-size: 0.9rem;
        font-weight: 500;
    }

    /* Results */
    .quiz-results {
        text-align: center;
        padding: 3rem 2rem;
        background: rgba(30, 41, 59, 0.5);
        border-radius: 32px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .result-icon { font-size: 5rem; margin-bottom: 1.5rem; filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.3)); }
    .result-score { font-size: 4rem; font-weight: 900; color: #fbbf24; margin: 1.5rem 0; }
    .result-actions { display: flex; flex-direction: column; gap: 1.2rem; margin-top: 3rem; }
    .primary-btn { 
        background: linear-gradient(135deg, #fbbf24, #f59e0b); 
        color: #1e293b; 
        padding: 1.3rem; 
        border-radius: 20px; 
        border: none; 
        font-weight: 800; 
        font-size: 1.1rem;
        cursor: pointer;
        box-shadow: 0 10px 20px rgba(251, 191, 36, 0.2);
    }
    .secondary-btn { 
        background: rgba(255, 255, 255, 0.05); 
        color: #f8fafc; 
        padding: 1.3rem; 
        border-radius: 20px; 
        border: 1px solid rgba(255, 255, 255, 0.1); 
        font-weight: 700; 
        font-size: 1rem;
        cursor: pointer; 
    }

    /* Saved List */
    .saved-container { padding: 1rem; }
    .saved-list { display: grid; gap: 1rem; }

    /* Empty State */
    .empty-state {
        text-align: center;
        padding: 5rem 2rem;
        color: #64748b;
        background: rgba(30, 41, 59, 0.3);
        border-radius: 24px;
        margin: 2rem 0;
    }
    .empty-state p { margin-bottom: 1rem; font-size: 1.1rem; }
    .retry-btn {
        background: rgba(96, 165, 250, 0.2);
        color: #60a5fa;
        border: 1px solid rgba(96, 165, 250, 0.3);
        padding: 0.8rem 1.5rem;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
    }

    @media (max-width: 600px) {
        .options-grid { grid-template-columns: 1fr; }
        .question-text { font-size: 1.6rem; }
        .flashcard-text { font-size: 1.8rem; }
        .flashcard-wrapper { height: 350px; }
    }
`;
document.head.appendChild(style);
