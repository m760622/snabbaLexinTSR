/**
 * Learn UI - Handles all learn page UI interactions
 */

import { lessonsData, Lesson, LessonSection, ExampleItem } from './learn/lessonsData';
import { TTSManager } from './tts';
import { LearnViewManager, LearnView, createLearnViewManager } from './learn/LearnViewManager';
import { debounce } from './performance-utils';
import { normalizeArabic } from './utils';
import { DictionaryDB } from './db';

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
let isTrainingSession = false;

// Performance: Lazy Loading State
let visibleLessonsCount = 12;
const PAGE_SIZE = 12;
let scrollObserver: IntersectionObserver | null = null;

// State
let currentBatch = 0;
const BATCH_Size = 12;
let isLoading = false;
let currentSearchTerm = '';
let activeFilter = 'all';

// User Stats (Gamification)
let totalXP = 0;
let userLevel = 1;

// XP Requirements per level
const XP_PER_LEVEL = 100;

// Gamification State - Sets
let trainingIds: Set<string> = new Set();
const mistakesIds: Set<string> = new Set(); // Track mistake IDs

// Load saved state
function loadState(): void {
    try {
        const savedXP = localStorage.getItem('learn_xp');
        const savedLevel = localStorage.getItem('learn_level');
        const savedStreak = localStorage.getItem('learn_streak');
        const savedLastVisit = localStorage.getItem('learn_last_visit');
        const savedCompleted = localStorage.getItem('learn_completed');
        const savedTraining = localStorage.getItem('learn_training');
        const savedMistakes = localStorage.getItem('learn_mistakes');

        if (savedXP) totalXP = parseInt(savedXP);
        if (savedLevel) userLevel = parseInt(savedLevel);
        if (savedStreak) streak = parseInt(savedStreak);
        if (savedLastVisit) lastVisitDate = savedLastVisit;

        if (savedCompleted) {
            JSON.parse(savedCompleted).forEach((id: string) => completedLessons.add(id));
        }
        if (savedTraining) {
            JSON.parse(savedTraining).forEach((id: string) => trainingIds.add(id));
        }
        if (savedMistakes) {
            JSON.parse(savedMistakes).forEach((id: string) => mistakesIds.add(id));
        }

        calculateStreak();
    } catch (e) {
        console.error('[LearnUI] Failed to load state:', e);
    }
}

// Save state
function saveState(): void {
    localStorage.setItem('learn_xp', totalXP.toString());
    localStorage.setItem('learn_level', userLevel.toString());
    localStorage.setItem('learn_streak', streak.toString());
    localStorage.setItem('learn_last_visit', lastVisitDate);
    localStorage.setItem('learn_completed', JSON.stringify([...completedLessons]));
    localStorage.setItem('learn_training', JSON.stringify([...trainingIds]));
    localStorage.setItem('learn_mistakes', JSON.stringify([...mistakesIds])); // Save mistakes

    updateReviewButton(); // Update UI
}

// Helper to track mistakes
function trackMistake(wordId: string) {
    if (!wordId) return;
    mistakesIds.add(wordId);
    saveState();
}

function clearMistake(wordId: string) {
    if (mistakesIds.has(wordId)) {
        mistakesIds.delete(wordId);
        saveState();
    }
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

// Word Lookup Cache
let wordIdMap: Map<string, string> | null = null;
// trainingIds moved to top level

function initWordLookup() {
    if (wordIdMap) return;
    wordIdMap = new Map();
    if (typeof dictionaryData !== 'undefined') {
        dictionaryData.forEach(row => {
            const id = row[0];
            const swe = (row[2] || '').toLowerCase().trim();
            // Store mapping: "hej" -> "123"
            if (swe && !wordIdMap!.has(swe)) {
                wordIdMap!.set(swe, id);
            }
        });
    }
}

function getWordId(text: string): string | null {
    if (!wordIdMap) initWordLookup();
    const key = text.toLowerCase().trim();
    // Try exact match
    if (wordIdMap!.has(key)) return wordIdMap!.get(key) || null;

    // Try removing exclamation marks etc?
    const cleanKey = key.replace(/[!?,.-]/g, '');
    if (wordIdMap!.has(cleanKey)) return wordIdMap!.get(cleanKey) || null;

    return null;
}

async function refreshTrainingIds() {
    try {
        const words = await DictionaryDB.getTrainingWords();
        trainingIds = new Set(words.map((w: any) => Array.isArray(w) ? w[0] : w.id));
    } catch (e) {
        console.error('Failed to load training ids', e);
    }
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

export function initQuiz(lessonId: string | null = null) {
    const targetId = lessonId || currentQuizLessonId;
    // Reset state after consuming it? 
    // currentQuizLessonId = null; // Maybe keep it if we retry?

    console.log('[LearnUI] Initializing Quiz...', targetId ? `for lesson: ${targetId}` : 'random mode');
    const container = document.getElementById('quizContent');
    if (!container) return;

    // Fast Render: Show Loading State Immediately
    container.innerHTML = `
        <div class="empty-state">
            <div class="spinner"></div>
            <p>${lessonId ? 'Laddar lektionsquiz...' : 'Laddar quiz...'}</p>
        </div>
    `;

    // Defer Heavy Calculation to next tick
    setTimeout(() => {
        try {
            // Reset State
            quizScore = 0;
            quizStreak = 0; // Reset streak
            currentQuestionIndex = 0;

            // Generate Questions from lessonsData
            quizQuestions = generateQuizQuestions(lessonId);

            if (quizQuestions.length === 0) {
                const isReview = (lessonId === 'review') || (targetId === 'review');
                const reviewMsgSv = "Du har inga sparade misstag att repetera! Bra jobbat! 🎉";
                const reviewMsgAr = "ليس لديك أخطاء محفوظة لمراجعتها! أحسنت! 🎉";
                const normalMsgSv = "Inga frågor tillgängliga för detta urval.";
                const normalMsgAr = "لا توجد أسئلة متاحة لهذا الاختيار.";

                container.innerHTML = `
                    <div class="empty-state">
                        <p class="sv-text">${isReview ? reviewMsgSv : normalMsgSv}</p>
                        <p class="ar-text">${isReview ? reviewMsgAr : normalMsgAr}</p>
                        <button class="retry-btn" onclick="switchMode('browse')">Tillbaka / رجوع</button>
                        ${isReview ? `<button class="secondary-btn" onclick="openRandomQuiz()" style="margin-top:1rem;background:none;border:1px solid #475569;color:#cbd5e1;padding:0.5rem 1rem;border-radius:8px;cursor:pointer;">Starta slumpmässigt quiz</button>` : ''}
                    </div>
                `;
                return;
            }

            showQuestion();
        } catch (error) {
            console.error('[LearnUI] Quiz generation failed:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <p>Ett fel uppstod när quizet skulle laddas.</p>
                    <p class="text-xs text-muted">${error}</p>
                    <button class="retry-btn" onclick="location.reload()">Ladda om</button>
                </div>
            `;
        }
    }, 50);
}


function generateQuizQuestions(lessonId: string | null) {
    const allExamples: ExampleItem[] = [];

    // Filter source lessons
    if (lessonId === 'review') {
        // Review Mode: Filter examples that are in mistakesIds
        lessonsData.forEach(lesson => {
            lesson.sections.forEach(section => {
                section.examples.forEach(ex => {
                    // Valid check: must have both swe and arb
                    if (!ex.swe || !ex.arb || !ex.swe.trim() || !ex.arb.trim()) return;

                    const id = getStableId(ex.swe);
                    if (mistakesIds.has(id)) {
                        allExamples.push(ex);
                    }
                });
            });
        });
    } else {
        const sourceLessons = lessonId
            ? lessonsData.filter(l => l.id === lessonId)
            : lessonsData;

        sourceLessons.forEach(lesson => {
            lesson.sections.forEach(section => {
                section.examples.forEach(ex => {
                    // Valid check
                    if (ex.swe && ex.arb && ex.swe.trim() && ex.arb.trim()) {
                        allExamples.push(ex);
                    }
                });
            });
        });
    }

    if (allExamples.length < 4 && lessonId !== 'review') {
        // Try to fetch more valid distractors globaly if needed
        if (lessonId && allExamples.length > 0) {
            // We have some valid examples, proceed.
            // Distractors will be fetched from global valid pool.
        } else {
            return [];
        }
    }

    // Shuffle and select a subset for the quiz
    const shuffledExamples = [...allExamples].sort(() => Math.random() - 0.5);
    const selectedExamples = shuffledExamples.slice(0, Math.min(shuffledExamples.length, 10)); // Max 10 questions

    // Prepare global pool of valid distractors once
    const globalDistractors: ExampleItem[] = [];
    lessonsData.forEach(l => l.sections.forEach(s => {
        s.examples.forEach(e => {
            if (e.swe && e.arb && e.swe.trim() && e.arb.trim()) {
                globalDistractors.push(e);
            }
        });
    }));

    // Generate quiz questions with options and correct answer
    const quizQuestions = selectedExamples.map(ex => {
        const questionType = Math.random() < 0.5 ? 'swe-to-arb' : 'arb-to-swe';
        const isSweToArb = questionType === 'swe-to-arb';

        const questionText = isSweToArb ? ex.swe : ex.arb;
        const answerText = isSweToArb ? ex.arb : ex.swe;

        // Generate distractors from VALID global pool
        const otherExamples = globalDistractors.filter(e => e.swe !== ex.swe);

        const distractors = [...otherExamples]
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(e => isSweToArb ? e.arb : e.swe);

        // Ensure unique options
        const uniqueOptions = Array.from(new Set([...distractors, answerText]));

        // Ensure 4 options
        while (uniqueOptions.length < 4 && otherExamples.length > uniqueOptions.length) {
            const randomEx = otherExamples[Math.floor(Math.random() * otherExamples.length)];
            const opt = isSweToArb ? randomEx.arb : randomEx.swe;
            if (!uniqueOptions.includes(opt)) {
                uniqueOptions.push(opt);
            }
        }

        const finalOptions = [...uniqueOptions].sort(() => Math.random() - 0.5);

        return {
            question: questionText,
            answer: answerText,
            options: [...uniqueOptions].sort(() => Math.random() - 0.5),
            type: questionType,
            example: ex
        };
    });
    return quizQuestions;
}


let quizStreak = 0; // New state

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
            <div class="quiz-stats-row">
                <div class="quiz-stat-item">
                    <span>📝</span>
                    <span>${currentQuestionIndex + 1}/${quizQuestions.length}</span>
                </div>
                <div class="quiz-stat-item">
                    <span>🏆</span>
                    <span>${quizScore}</span>
                </div>
                <div class="quiz-stat-item streak-container ${quizStreak > 2 ? 'active' : ''}">
                    <span>🔥</span>
                    <span id="streakCounter">${quizStreak}</span>
                </div>
            </div>
        </div>

        <div class="question-card">
            <div class="question-text ${q.type === 'arb-to-swe' ? 'ar-text' : 'sv-text'}" dir="${q.type === 'arb-to-swe' ? 'rtl' : 'ltr'}">
                ${q.question}
            </div>
        </div>

        <div class="options-grid">
            ${q.options.map((opt: string) => {
        return `
                <button class="option-btn ${q.type === 'swe-to-arb' ? 'ar-text' : 'sv-text'}" 
                        onclick="checkAnswer(this.textContent.trim())" 
                        dir="${q.type === 'swe-to-arb' ? 'rtl' : 'ltr'}">
                    ${opt}
                </button>
                `;
    }).join('')}
        </div>
    `;

    // Parse emojis
    if (typeof (window as any).twemoji !== 'undefined') {
        (window as any).twemoji.parse(container, { folder: 'svg', ext: '.svg' });
    }
}

// Sound Manager
import { SoundManager } from './utils/SoundManager';

// ... (existing imports if any)

function checkAnswer(selected: string) {
    const q = quizQuestions[currentQuestionIndex];
    const options = document.querySelectorAll('.option-btn');
    const soundManager = SoundManager.getInstance();

    let isCorrect = (selected === q.answer);

    options.forEach(btn => {
        const btnText = (btn as HTMLElement).textContent?.trim();
        if (btnText === q.answer) {
            btn.classList.add('correct-answer');
            if (isCorrect) {
                // Play Sound
                soundManager.play('correct');

                // Animate correct button
                btn.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.05)', backgroundColor: 'rgba(34, 197, 94, 0.4)' },
                    { transform: 'scale(1)' }
                ], { duration: 300 });
            }
        } else if (btnText === selected && !isCorrect) {
            btn.classList.add('wrong-answer');
            soundManager.play('wrong');

            // Haptic Feedback
            if (navigator.vibrate) navigator.vibrate(200);

            // Shake animation for wrong answer
            btn.animate([
                { transform: 'translateX(0)' },
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(5px)' },
                { transform: 'translateX(-5px)' },
                { transform: 'translateX(0)' }
            ], { duration: 400 });
        }
        (btn as HTMLButtonElement).disabled = true;
    });

    if (isCorrect) {
        quizScore++;
        quizStreak++;

        const wordId = getStableId(q.example.swe);
        clearMistake(wordId);

        // Base XP
        let earnedXP = 5;

        if (quizStreak >= 3) {
            earnedXP += 2;
            // Streak Sound every 3
            if (quizStreak % 3 === 0) soundManager.play('streak');

            const streakCounter = document.getElementById('streakCounter');
            if (streakCounter) {
                streakCounter.parentElement?.classList.add('active'); // Ensure active
                streakCounter.parentElement?.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.5)', textShadow: '0 0 20px #f97316' },
                    { transform: 'scale(1)' }
                ], { duration: 400, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' });
            }
        }

        addXP(earnedXP);
    } else {
        quizStreak = 0; // Reset streak
        // Track mistake
        const wordId = getStableId(q.example.swe);
        trackMistake(wordId);
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

    const soundManager = SoundManager.getInstance();
    const percentage = (quizScore / quizQuestions.length) * 100;
    const passed = percentage >= 70;

    if (passed) soundManager.play('win');

    // Use Overlay for Premium Feel
    container.innerHTML = `
        <div class="quiz-results-overlay">
            <div class="quiz-results-card">
                <span class="result-icon-large">${passed ? '🎉' : '💪'}</span>
                <h2 style="font-size: 1.5rem; margin-bottom:0.5rem;">${passed ? 'Fantastiskt!' : 'Bra kämpat!'}</h2>
                <div class="result-score-large">${quizScore}<span style="font-size:1.5rem; color:#94a3b8;">/${quizQuestions.length}</span></div>
                <p style="color:var(--text-muted); margin-bottom: 2rem;">
                    ${passed ? 'Du klarade det galant!' : 'Övning ger färdighet. Försök igen!'}
                </p>
                
                <div class="result-actions" style="display:flex; flex-direction:column; gap:0.75rem;">
                    <button class="primary-btn" onclick="initQuiz('${currentQuizLessonId || ''}')" style="width:100%; justify-content:center;">
                        ${passed ? 'Spela igen / العودة' : 'Försök igen / حاول مرة أخرى'}
                    </button>
                    <button class="secondary-btn" onclick="switchMode('browse')" style="width:100%; justify-content:center; background:rgba(255,255,255,0.05);">
                        Avsluta / إنهاء
                    </button>
                </div>
            </div>
        </div>
    `;

    // Confetti Effect if passed (Optional, if confetti lib exists)
    if (passed && (window as any).confetti) {
        (window as any).confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        });
    }
}

// ========== FLASHCARD LOGIC ==========
export function initFlashcards() {
    // If we are in training mode, don't override with lesson data!
    if (isTrainingSession) {
        return;
    }
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
        // Load mastered words from localStorage
        let masteredIds: Set<string> = new Set();
        try {
            const saved = localStorage.getItem('snabbaLexin_mastered');
            if (saved) {
                masteredIds = new Set(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('Failed to load mastered words:', e);
        }

        // Grab all examples
        const allExamples: ExampleItem[] = [];
        lessonsData.forEach(lesson => {
            lesson.sections.forEach(section => {
                allExamples.push(...section.examples);
            });
        });

        // Filter out mastered words
        const availableExamples = allExamples.filter(ex => {
            const id = (ex.swe ? ex.swe.toLowerCase().replace(/\s+/g, '_') : '');
            return !masteredIds.has(id);
        });

        // Use available examples if possible, otherwise fallback to all (reset)
        const source = availableExamples.length > 0 ? availableExamples : allExamples;

        if (availableExamples.length === 0 && allExamples.length > 0) {
            // Optional: Show message that all words are mastered?
            // For now, loop back to start.
        }

        // Shuffle
        flashcardItems = [...source].sort(() => Math.random() - 0.5).slice(0, 15);
        currentFlashcardIndex = 0;
        isFlipped = false;

        if (flashcardItems.length === 0) {
            container.innerHTML = `<div class="empty-state">Inga ord att träna på. Lägg till ord från ordboken!</div>`;
            return;
        }

        showFlashcard();
    }, 50);
}

// Start specific training session
async function startTrainingSession() {
    console.log('[LearnUI] Starting Training Session...');
    isTrainingSession = true;
    switchMode('flashcard');

    const container = document.getElementById('flashcardContent');
    if (container) {
        container.innerHTML = `<div class="empty-state"><p>Hämtar dina ord...</p></div>`;
    }

    try {
        const words = await DictionaryDB.getTrainingWords();

        if (!words || words.length === 0) {
            if (container) container.innerHTML = `
                <div class="empty-state">
                    <div class="emoji-lg">💪</div>
                    <h3>Inga ord än</h3>
                    <p>Markera ord med "💪" i ordboken för att träna på dem här.</p>
                </div>
            `;
            return;
        }

        // Map DB words to Flashcard Items
        flashcardItems = words.map(w => {
            // Handle both Raw Array (fresh) and Object (legacy/fallback) formats
            const isArray = Array.isArray(w);
            return {
                id: isArray ? w[0] : (w.id || ''),
                swe: isArray ? w[2] : (w.swe || ''),
                arb: isArray ? w[3] : (w.arb || ''),
                type: isArray ? w[1] : (w.type || ''),
                exSwe: isArray ? (w[7] || '') : (w.sweEx || ''),
                exArb: isArray ? (w[8] || '') : (w.arbEx || ''),
                isTraining: true
            };
        }); // Shuffle? .sort(() => Math.random() - 0.5);

        currentFlashcardIndex = 0;
        isFlipped = false;

        showFlashcard();

    } catch (e) {
        console.error('Error starting training:', e);
    }
}


function showFlashcard() {
    const container = document.getElementById('flashcardContent');
    if (!container) return;

    if (currentFlashcardIndex >= flashcardItems.length) {
        finishFlashcards();
        return;
    }

    const item = flashcardItems[currentFlashcardIndex];
    const progress = ((currentFlashcardIndex) / flashcardItems.length) * 100;

    // Check if we have examples
    const hasExSwe = item.exSwe && item.exSwe.length > 2;
    const hasExArb = item.exArb && item.exArb.length > 2;

    container.innerHTML = `
        <div class="flashcard-header">
            <div class="quiz-progress-bar">
                <div class="quiz-progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="flashcard-counter">${currentFlashcardIndex + 1} / ${flashcardItems.length}</div>
        </div>

        <div class="flashcard-wrapper ${isFlipped ? 'flipped' : ''}" onclick="flipFlashcard()">
            <div class="flashcard-inner">
                <div class="flashcard-face flashcard-front">
                    <div class="flashcard-word sv-text" lang="sv">${item.swe}</div>
                    ${hasExSwe ? `<div class="flashcard-example sv-text">"${item.exSwe}"</div>` : ''}
                    <div class="flashcard-hint">
                        <span class="pulse-icon">👆</span> Klicka för att vända / انقر للقلب
                    </div>
                </div>
                <div class="flashcard-face flashcard-back">
                    <div class="flashcard-translation" dir="rtl" lang="ar">${item.arb}</div>
                    ${hasExArb ? `<div class="flashcard-example" dir="rtl">${item.exArb}</div>` : ''}
                    <div class="flashcard-hint">
                        <span class="pulse-icon">👆</span> Klicka för att vända / انقر للقلب
                    </div>
            </div>
        </div>

        <div class="flashcard-controls">
            <button class="fc-btn fc-btn-dont-know" onclick="nextFlashcard(false, event)">
                ❌ Vet ej / لا أعرف
            </button>
            
            <button class="fc-btn fc-btn-know" onclick="nextFlashcard(true, event)">
                ✅ Kan det / أعرفها
            </button>
        </div>
        
        <div style="text-align: center; margin-top: 1rem; color: var(--text-muted); font-size: 0.8rem;">
            <p>Space: Vänd • ⬅️ Vet ej • ➡️ Kan det</p>
    `;

    // Add keyboard listener if not already added
    if (!(window as any).hasFlashcardListeners) {
        document.addEventListener('keydown', handleFlashcardKeys);
        (window as any).hasFlashcardListeners = true;
    }
}

// Keyboard handler
function handleFlashcardKeys(e: KeyboardEvent) {
    if (document.getElementById('flashcardContent')) {
        if (e.code === 'Space') {
            e.preventDefault();
            flipFlashcard();
        } else if (e.code === 'ArrowLeft') {
            nextFlashcard(false);
        } else if (e.code === 'ArrowRight') {
            nextFlashcard(true);
        }
    }
}

export function flipFlashcard() {
    isFlipped = !isFlipped;
    const wrapper = document.querySelector('.flashcard-wrapper');
    if (wrapper) {
        if (isFlipped) wrapper.classList.add('flipped');
        else wrapper.classList.remove('flipped');

        // Play subtle flip sound if available
        // SoundManager.getInstance().play('flip');
    }
}

export function nextFlashcard(known: boolean = false, event?: Event) {
    if (event) event.stopPropagation(); // Prevent flip

    const wrapper = document.querySelector('.flashcard-wrapper');

    // Animation for "Don't Know" (Slide Left)
    if (wrapper && !known) {
        wrapper.classList.add('animate-dont-know');
        SoundManager.getInstance().play('wrong');
        if (navigator.vibrate) navigator.vibrate(50);
    }

    // Logic: If known, trigger Mastered flow
    if (known) {
        markAsMastered(flashcardItems[currentFlashcardIndex].id);
        return;
    }

    setTimeout(() => {
        isFlipped = false;
        currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcardItems.length;
        showFlashcard();
    }, 300); // Wait for animation
}

// Re-implement markAsMastered for Training Mode compatibility
async function markAsMastered(id: string) {
    const wrapper = document.querySelector('.flashcard-wrapper');
    if (wrapper) {
        wrapper.classList.add('animate-mastered'); // Fly up!
        // Wait for animation before removing
        setTimeout(async () => {
            // ALWAYS set as NOT needing training in DB, regardless of session type
            // This ensures if it WAS in training list, it's removed.
            // If it wasn't, no harm done.
            try {
                if (id) {
                    await DictionaryDB.updateTrainingStatus(id, false);

                    // Also save to localStorage for Random Mode persistence
                    try {
                        const saved = localStorage.getItem('snabbaLexin_mastered');
                        const masteredIds = saved ? new Set(JSON.parse(saved)) : new Set();
                        masteredIds.add(id);
                        localStorage.setItem('snabbaLexin_mastered', JSON.stringify([...masteredIds]));
                    } catch (e) {
                        console.warn('Failed to save to localStorage:', e);
                    }
                }
            } catch (e) {
                console.error('Failed to update DB:', e);
            }

            // Remove from local array
            flashcardItems.splice(currentFlashcardIndex, 1);

            // Show Toast Feedback
            // showToast('Ord borttaget från träning! 🗑️'); // Need access to showToast or equivalent

            if (flashcardItems.length === 0) {
                const container = document.getElementById('flashcardContent');
                if (container) container.innerHTML = `
                <div class="empty-state">
                    <div class="emoji-lg">🎉</div>
                    <h3>Bra jobbat!</h3>
                    <p>Du har tränat klart alla dina ord.</p>
                    <button class="primary-btn" onclick="switchMode('browse')">Tillbaka</button>
                </div>
            `;
                return;
            }

            if (currentFlashcardIndex >= flashcardItems.length) {
                currentFlashcardIndex = 0;
            }

            isFlipped = false;
            showFlashcard();
        }, 600); // Match CSS animation duration
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
async function openLesson(lessonId: string): Promise<void> {
    const lesson = lessonsData.find(l => l.id === lessonId);
    if (!lesson) return;

    currentLesson = lesson;

    // Refresh training status before rendering
    await refreshTrainingIds();

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
                            ${renderExamplesList(section.examples.slice(0, 10))}
                            
                            ${section.examples.length > 10 ? `
                                <button class="show-more-btn" onclick="this.parentElement.classList.add('expanded'); this.remove();">
                                    Visa ${section.examples.length - 10} till...
                                </button>
                                <div class="more-examples">
                                    ${renderExamplesList(section.examples.slice(10))}
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}

            <div class="lesson-actions">
                <button class="quiz-lesson-btn" onclick="startLessonQuiz('${lesson.id}')">
                    🧠 <span class="sv-text">Testa dig själv</span><span class="ar-text">اختبر نفسك</span>
                </button>
                <div class="spacer" style="width: 12px;"></div>
                <button class="complete-lesson-btn" onclick="completeLesson('${lesson.id}')">
                    ✅ <span class="sv-text">Markera som klar</span><span class="ar-text">اكتمل</span>
                </button>
            </div>
        </div>
    `;
}

function renderExamplesList(examples: ExampleItem[]): string {
    return examples.map(ex => {
        // Try dictionary ID first, fall back to stable custom ID
        let wordId = getWordId(ex.swe);
        let exampleDataEncoded = '';

        if (!wordId) {
            wordId = getStableId(ex.swe);
            // Encode data for custom creation
            exampleDataEncoded = encodeURIComponent(JSON.stringify(ex));
        }

        const isTraining = wordId && trainingIds.has(wordId);

        return `
            <div class="example-item">
                <div class="example-swe">
                    <button class="speak-btn" onclick="speakText('${ex.swe.replace(/'/g, "\\'")}', 'sv')">🔊</button>
                    <span>${ex.swe}</span>
                </div>
                <div class="example-actions-row">
                    <div class="example-arb">${ex.arb}</div>
                    <button class="train-mini-btn ${isTraining ? 'active' : ''}" 
                            onclick="toggleTrainingWord('${wordId}', this, '${exampleDataEncoded}')"
                            aria-label="Träna / تدريب">
                        ${isTraining ? '🧠' : '💪'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
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
            chip.classList.add('active');
            currentFilter = chip.getAttribute('data-filter') || 'all';

            if (currentFilter === 'training') {
                startTrainingSession();
            } else {
                renderLessons();
            }
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

    // Check if we have mistakes
    if (mistakesIds.size === 0) {
        // Show celebration or fallback
        // Since we don't have a toast system ready in this snippet, 
        // we can fallback to random quiz OR show a "You are perfect!" alert.
        // For now, let's open random but maybe log it.
        // Or better: Use initQuiz('review') anyway, which will show "Empty State".
        // But the empty state text currently says "Inga frågor för detta urval". 
        // We should customize emptiness.
    }

    closeLessonModal();
    switchMode('quiz');
    currentQuizLessonId = 'review';
}

// Start quiz for specific lesson
function startLessonQuiz(lessonId: string) {
    closeLessonModal();
    switchMode('quiz');
    // We need to pass the ID to initQuiz. 
    // Since switchMode trigger 'onActivate' which calls initQuiz() without args,
    // we might need to override behavior or store state.
    // Simpler: Just call initQuiz(lessonId) directly AFTER switchMode, 
    // but switchMode's onActivate might race or double init.

    // Hack: Set a global flag or modify initQuiz to check a 'pendingQuizLessonId'
    // Better: Allow onActivate to accept params? No, viewManager is simple.

    // Let's manually init quiz after a tiny delay to overwrite the default onActivate one,
    // OR update viewManager onActivate handler?

    // Simplest approach: Just call initQuiz(lessonId). 
    // The onActivate will run initQuiz() (random), then we overwrite it. 
    // Ensure we clear/cancel previous timeouts if any. 
    // But since initQuiz has a 50ms timeout, we can set a flag `currentQuizLesson` before switching.

    // Let's refactor `currentQuizLesson` state.
    currentQuizLessonId = lessonId;
    // switchMode will call initQuiz(), which we will update to use the state.
}

let currentQuizLessonId: string | null = null;

// Export to window
function exportToWindow(): void {
    (window as any).startLessonQuiz = startLessonQuiz;
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
    (window as any).toggleTrainingWord = toggleTrainingWord;
    (window as any).markAsMastered = markAsMastered;
    (window as any).startTrainingSession = startTrainingSession;
}

// Toggle Training Word
async function toggleTrainingWord(wordId: string, btn: HTMLElement) {
    if (!wordId) return;

    try {
        const isNowTraining = !trainingIds.has(wordId);

        // Optimistic UI Update
        if (isNowTraining) {
            trainingIds.add(wordId);
            btn.classList.add('active');
            btn.textContent = '🧠';
        } else {
            trainingIds.delete(wordId);
            btn.classList.remove('active');
            btn.textContent = '💪';
        }

        // Persist
        await DictionaryDB.updateTrainingStatus(wordId, isNowTraining);

        // Feedback
        // (window as any).showToast(isNowTraining ? 'Tillagd i träning' : 'Borttagen från träning');

    } catch (e) {
        console.error('Failed to toggle training:', e);
        // Revert UI on error
        // ...
    }
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
            // Provide fallback properties if missing (defensive)
            const swe = word.swedish || word.swe || "???";
            const arb = word.arabic || word.arb || "???";

            console.log('[LearnUI] Word of the Day:', swe, word);

            if (wodWord) wodWord.textContent = swe;
            if (wodTranslation) wodTranslation.textContent = arb;

            // Find an example if available, or create a fallback
            const exampleSwe = word.example || word.sweEx || `${swe} är ett bra ord.`;
            const exampleArb = word.example_ar || word.arbEx || `كلمة ${arb} كلمة جيدة.`;

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

// Helper: Simple stable hash for string
function getStableId(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return 'cust_' + Math.abs(hash).toString(36);
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
    setupSearch();
    initScrollObserver();
    renderLessons();
    updateReviewButton(); // Check specifically for review button
    initWordOfDay();

    // Check URL params for mode
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    if (mode === 'training') {
        setTimeout(() => {
            const trainingBtn = document.querySelector('.filter-training') as HTMLElement;
            if (trainingBtn) {
                trainingBtn.click();
            } else {
                startTrainingSession();
            }
        }, 100);
    }

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

// Update Review Button visibility
function updateReviewButton() {
    // Try to find filters container
    const filtersContainer = document.querySelector('.filters-scroll');
    if (!filtersContainer) return;

    let btn = document.getElementById('btn-review-mistakes');
    const count = mistakesIds.size;

    if (count > 0) {
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'btn-review-mistakes';
            btn.className = 'filter-chip';
            btn.style.background = 'rgba(239, 68, 68, 0.2)'; // Red tint
            btn.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            btn.style.color = '#fca5a5';
            btn.onclick = openReviewSession;
            // Insert as first item for visibility
            filtersContainer.insertBefore(btn, filtersContainer.firstChild);
        }
        btn.innerHTML = `🧠 Review (${count})`;
        btn.style.display = 'inline-flex';
    } else {
        if (btn) btn.style.display = 'none';
    }
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


    .quiz-lesson-btn {
        flex: 1;
        background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
        color: white;
        border: none;
        padding: 1rem;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 6px -1px rgba(109, 40, 217, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
    }

    .quiz-lesson-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(109, 40, 217, 0.4);
    }

    .quiz-lesson-btn:active {
        transform: translateY(0);
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

    .quiz-stats-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 0.5rem;
        margin-top: 0.5rem;
        font-size: 0.9rem;
        color: #94a3b8;
    }

    .quiz-stat-item {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(15, 23, 42, 0.4);
        padding: 6px 12px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .streak-container {
        color: #64748b;
        transition: color 0.3s, transform 0.3s;
    }

    .streak-container.active {
        color: #f59e0b; /* Amber 500 */
        border-color: rgba(245, 158, 11, 0.2);
        background: rgba(245, 158, 11, 0.1);
        font-weight: bold;
        box-shadow: 0 0 10px rgba(245, 158, 11, 0.2);
    }
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
        margin-bottom: 0.5rem;
    }

    .example-actions-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
    }

    /* Matching .action-btn-premium style */
    .train-mini-btn {
        width: 44px;
        height: 44px;
        background: linear-gradient(135deg, #1e3a8a 0%, #0ea5e9 100%);
        color: white;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        flex-shrink: 0;
        box-shadow: 0 4px 10px rgba(0, 91, 150, 0.3);
        position: relative;
        overflow: hidden;
    }

    .train-mini-btn::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: width 0.4s, height 0.4s;
    }

    .train-mini-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(0, 91, 150, 0.4);
    }

    .train-mini-btn:hover::before {
        width: 100px;
        height: 100px;
    }

    .train-mini-btn.active {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: none;
        color: #94a3b8;
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
    .question-card {
        padding: 1rem;
        margin-bottom: 1rem;
    }
    .question-text { margin-bottom: 1rem; }
    
    .options-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.8rem;
    }
    .option-btn {
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 1rem;
        border-radius: 16px;
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
        max-width: 414px;
        margin: 0 auto;
    }
    .flashcard-header { 
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    .flashcard-wrapper {
        perspective: 1200px;
        height: 340px;
        width: 100%;
        margin-bottom: 1.5rem;
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
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 32px;
        padding: 1.5rem;
        box-shadow: 
            0 20px 40px -10px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    .flashcard-front::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 32px;
        padding: 1px;
        background: linear-gradient(to bottom right, rgba(255,255,255,0.1), rgba(255,255,255,0));
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
    }
    .flashcard-back {
        transform: rotateY(180deg);
        border-color: rgba(96, 165, 250, 0.2);
    }
    .flashcard-label {
        display: none;
    }
    .flashcard-text {
        font-size: 2.5rem;
        font-weight: 800;
        color: #f8fafc;
        line-height: 1.2;
        text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        margin-bottom: 0.5rem;
    }
    .flashcard-example {
        background: rgba(255, 255, 255, 0.05);
        padding: 1rem 1.25rem;
        border-radius: 16px;
        margin-top: 1rem;
        font-size: 1rem;
        color: #cbd5e1;
        font-style: italic;
        border: 1px solid rgba(255, 255, 255, 0.05);
        max-width: 90%;
        line-height: 1.6;
    }
    .flashcard-hint {
        font-size: 0.8rem;
        color: #64748b;
        margin-top: 1rem;
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
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
    }
    .know-btn { 
        background: linear-gradient(135deg, #fbbf24, #d97706);
        color: #1e293b; 
        border: none !important;
        box-shadow: 0 8px 20px rgba(251, 191, 36, 0.3);
    }
    .know-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 25px rgba(251, 191, 36, 0.4);
    }
    
    .flashcard-counter {
        text-align: right;
        margin: 0;
        color: #94a3b8;
        font-size: 1rem;
        font-weight: 600;
        white-space: nowrap;
        min-width: fit-content;
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

    .flashcard-example {
        font-size: 1.1rem;
        margin-top: 1.5rem;
        opacity: 0.9;
        font-style: italic;
        padding: 0 1rem;
        line-height: 1.6;
        color: #e2e8f0;
        background: rgba(255, 255, 255, 0.05);
        padding: 0.8rem;
        border-radius: 12px;
        width: 100%;
    }
`;
document.head.appendChild(style);
