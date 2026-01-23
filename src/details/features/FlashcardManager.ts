import { SwipeNavigator } from '../ui/SwipeNavigator';
import { MasteryManager } from './MasteryManager';
import { WeakWordsManager } from './WeakWordsManager';
import { showToast } from '../../utils';

/**
 * Flashcard Manager - Clean Minimal Learning Experience
 */
export class FlashcardManager {
    private static isFlipped = false;
    private static currentMode: 'normal' | 'reverse' | 'listening' | 'challenge' = 'normal';
    private static focusMode = false;
    private static streak = 0;
    private static xp = 0;
    private static sessionStats = { correct: 0, wrong: 0, total: 0 };
    private static startTime = Date.now();
    private static currentWordData: any[] | null = null;

    // Dynamic text sizing based on text length
    private static getTextSizeClass(text: string): string {
        const len = text.length;
        if (len <= 8) return 'text-xl';
        if (len <= 15) return 'text-lg';
        if (len <= 25) return 'text-md';
        if (len <= 40) return 'text-sm';
        return 'text-xs';
    }

    // Simple success glow effect (replaces confetti)
    private static showSuccessGlow() {
        const card = document.querySelector('.flashcard-clean');
        if (card) {
            card.classList.add('fc-success-glow');
            setTimeout(() => card.classList.remove('fc-success-glow'), 600);
        }
    }

    // Subtle error flash (replaces shake)
    private static showErrorFlash() {
        const card = document.querySelector('.flashcard-clean');
        if (card) {
            card.classList.add('fc-error-flash');
            setTimeout(() => card.classList.remove('fc-error-flash'), 400);
        }
    }

    // Toggle focus mode
    static toggleFocus() {
        this.focusMode = !this.focusMode;
        const cardArea = document.querySelector('.fc-card-area');
        const statsBar = document.getElementById('fcStatsBar');
        const header = document.querySelector('.fc-minimal-header');

        if (this.focusMode) {
            cardArea?.classList.add('focus-mode');
            statsBar?.classList.add('hidden');
            header?.classList.add('hidden');
            showToast('🧘 <span class="sv-text">Fokusläge aktiverat</span><span class="ar-text">وضع التركيز مُفعّل</span>', { type: 'info' });
        } else {
            cardArea?.classList.remove('focus-mode');
            statsBar?.classList.remove('hidden');
            header?.classList.remove('hidden');
            showToast('<span class="sv-text">Fokusläge avslutat</span><span class="ar-text">انتهى وضع التركيز</span>');
        }
    }

    // Play audio for the word
    private static playAudio(word: string) {
        if ((window as any).TTSManager) {
            (window as any).TTSManager.speak(word, 'sv');
        }
    }

    // Format time elapsed
    private static formatTime(ms: number): string {
        const secs = Math.floor(ms / 1000);
        const mins = Math.floor(secs / 60);
        const s = secs % 60;
        return `${mins}:${s.toString().padStart(2, '0')}`;
    }

    // Get accuracy percentage  
    private static getAccuracy(): number {
        if (this.sessionStats.total === 0) return 0;
        return Math.round((this.sessionStats.correct / this.sessionStats.total) * 100);
    }

    static init(wordData: any[]) {
        const container = document.getElementById('flashcardContainer');
        if (!container) return;

        this.currentWordData = wordData;
        const swe = wordData[2];
        const arb = wordData[3];
        const type = wordData[1];
        const exSwe = wordData[7] || '';

        const forms = wordData[6] || '';

        const gender = wordData[13] || '';
        // TypeColorSystem expected to be global or imported. Using global for now as I can't find source.
        const TypeColorSystem = (window as any).TypeColorSystem;
        const glowClass = TypeColorSystem ? TypeColorSystem.getGlowClass(type, swe, forms, gender, arb) : '';
        const sweSizeClass = this.getTextSizeClass(swe);
        const arbSizeClass = this.getTextSizeClass(arb);

        // Get front/back content based on mode
        const frontWord = this.currentMode === 'reverse' ? arb : swe;
        const backWord = this.currentMode === 'reverse' ? swe : arb;
        const frontDir = this.currentMode === 'reverse' ? 'rtl' : 'ltr';
        const backDir = this.currentMode === 'reverse' ? 'ltr' : 'rtl';

        container.innerHTML = `
            <!-- Minimal Header: Mode + Focus Toggle -->
            <div class="fc-minimal-header">
                <div class="fc-mode-pills">
                    <button class="fc-pill ${this.currentMode === 'normal' ? 'active' : ''}" onclick="FlashcardManager.setMode('normal')" title="Normal / عادي">🇸🇪</button>
                    <button class="fc-pill ${this.currentMode === 'reverse' ? 'active' : ''}" onclick="FlashcardManager.setMode('reverse')" title="Omvänd / عكسي">🔄</button>
                    <button class="fc-pill ${this.currentMode === 'listening' ? 'active' : ''}" onclick="FlashcardManager.setMode('listening')" title="Lyssna / استماع">🎧</button>
                </div>
                <button class="fc-focus-toggle" onclick="FlashcardManager.toggleFocus()" title="Fokusläge / وضع التركيز">
                    ⛶
                </button>
            </div>
            
            <!-- Collapsible Stats (hidden by default, show on hover/click) -->
            <div class="fc-stats-minimal" id="fcStatsBar">
                <span class="fc-mini-stat">🔥<span id="fcStreak">${this.streak}</span></span>
                <span class="fc-mini-stat">⭐<span id="fcXP">${this.xp}</span></span>
                <span class="fc-mini-stat">🎯<span id="fcAccuracy">${this.getAccuracy()}%</span></span>
            </div>
            
            <div class="fc-card-area ${this.focusMode ? 'focus-mode' : ''}">
                ${this.currentMode === 'listening' ? `
                    <!-- Listening Mode: Simple Design -->
                    <div class="fc-listen-simple">
                        <button class="fc-listen-circle" onclick="FlashcardManager.playAudio('${swe}')">
                            🔊
                        </button>
                        <div class="fc-listen-grid quiz-options">
                            ${this.generateListeningOptions(swe)}
                        </div>
                    </div>
                ` : `
                    <!-- Ultra Clean Flashcard -->
                    <div class="flashcard-clean ${glowClass}" onclick="FlashcardManager.flip()">
                        <div class="flashcard-clean-inner">
                            <!-- Front: Word Only -->
                            <div class="flashcard-clean-front">
                                <div class="fc-front-word ${this.currentMode === 'reverse' ? arbSizeClass : sweSizeClass}" dir="${frontDir}">${frontWord}</div>
                            </div>
                            <!-- Back: Translation + Example -->
                            <div class="flashcard-clean-back">
                                <div class="fc-back-swe">${swe}</div>
                                <div class="fc-back-divider"></div>
                                <div class="fc-back-arb">${arb}</div>
                                ${exSwe ? `<div class="fc-back-example">"${exSwe}"</div>` : ''}
                            </div>
                        </div>
                        <!-- Audio: Appears on hover/tap -->
                        <button class="fc-audio-float" onclick="event.stopPropagation(); FlashcardManager.playAudio('${swe}')">🔊</button>
                    </div>
                `}
                
                <!-- Icon-Only Rating Buttons -->
                <div class="fc-actions-simple">
                    <button class="fc-action-btn wrong" onclick="FlashcardManager.markWrong('${wordData[0]}')" title="Vet inte / لا أعرف">
                        ❌
                    </button>
                    <button class="fc-action-btn correct" onclick="FlashcardManager.markCorrect('${wordData[0]}')" title="Vet / أعرف">
                        ✅
                    </button>
                </div>
                
                <!-- Minimal Navigation (hidden in focus mode) -->
                <div class="fc-nav-simple">
                    <button class="fc-nav-icon" onclick="SwipeNavigator.navigate(-1)" title="Föregående / السابق">←</button>
                    <button class="fc-nav-icon random" onclick="FlashcardManager.randomWord()" title="Slumpmässigt / عشوائي">🎲</button>
                    <button class="fc-nav-icon" onclick="SwipeNavigator.navigate(1)" title="Nästa / التالي">→</button>
                </div>
            </div>
        `;

        this.isFlipped = false;
        this.setupKeyboardShortcuts();
        this.startTimeUpdater();
    }

    // Generate listening mode options
    private static generateListeningOptions(correctWord: string): string {
        const allData = (window as any).dictionaryData as any[][] || [];
        const distractors = allData
            .filter(w => w[2] !== correctWord)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(w => w[2]);

        const options = [...distractors, correctWord].sort(() => Math.random() - 0.5);

        return options.map(opt => `
            <button class="quiz-option" onclick="FlashcardManager.checkListeningAnswer('${opt}', '${correctWord}')">
                ${opt}
            </button>
        `).join('');
    }

    // Check listening mode answer
    static checkListeningAnswer(selected: string, correct: string) {
        if (selected === correct) {
            this.markCorrect(this.currentWordData?.[0] || '');
        } else {
            this.markWrong(this.currentWordData?.[0] || '');
        }
    }

    // Set learning mode
    static setMode(mode: 'normal' | 'reverse' | 'listening' | 'challenge') {
        this.currentMode = mode;
        if (this.currentWordData) {
            this.init(this.currentWordData);
        }
    }

    // Keyboard shortcuts
    private static setupKeyboardShortcuts() {
        document.onkeydown = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.flip();
            } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                SwipeNavigator.navigate(1);
            } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                SwipeNavigator.navigate(-1);
            } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                this.markCorrect(this.currentWordData?.[0] || '');
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.markWrong(this.currentWordData?.[0] || '');
            }
        };
    }

    // Time updater
    private static startTimeUpdater() {
        setInterval(() => {
            const el = document.getElementById('fcTime');
            if (el) el.textContent = this.formatTime(Date.now() - this.startTime);
        }, 1000);
    }

    static flip() {
        const card = document.querySelector('.flashcard-clean');
        if (card) {
            this.isFlipped = !this.isFlipped;
            card.classList.toggle('flipped', this.isFlipped);
            card.classList.add('shimmering');
            setTimeout(() => card.classList.remove('shimmering'), 1500);

            // Auto-play audio on flip to back
            if (this.isFlipped && this.currentWordData) {
                setTimeout(() => this.playAudio(this.currentWordData![2]), 300);
            }
        }
    }

    static randomWord() {
        const allData = (window as any).dictionaryData as any[][];
        if (!allData || allData.length === 0) return;

        const randomIndex = Math.floor(Math.random() * allData.length);
        const randomWord = allData[randomIndex];
        window.location.href = `details.html?id=${randomWord[0]}`;
    }

    static markCorrect(wordId: string) {
        // Update stats
        this.streak++;
        this.xp += 10 + (this.streak * 2); // Bonus XP for streak
        this.sessionStats.correct++;
        this.sessionStats.total++;

        // Update UI
        this.updateStatsUI();

        // Visual feedback
        this.showSuccessGlow();
        showToast(`✅ +${10 + (this.streak * 2)} XP`, { type: 'success' });

        // Save progress
        MasteryManager.updateMastery(wordId, true);
        WeakWordsManager.recordCorrect(wordId);

        // Go to next word after delay
        setTimeout(() => SwipeNavigator.navigate(1), 800);
    }

    static markWrong(wordId: string) {
        // Update stats
        this.streak = 0;
        this.sessionStats.wrong++;
        this.sessionStats.total++;

        // Update UI
        this.updateStatsUI();

        // Visual feedback
        this.showErrorFlash();
        showToast('❌', { type: 'error' });

        // Save progress
        MasteryManager.updateMastery(wordId, false);
        WeakWordsManager.recordWrong(wordId);
    }

    private static updateStatsUI() {
        const streakEl = document.getElementById('fcStreak');
        const xpEl = document.getElementById('fcXP');
        const accEl = document.getElementById('fcAccuracy');

        if (streakEl) streakEl.textContent = this.streak.toString();
        if (xpEl) xpEl.textContent = this.xp.toString();
        if (accEl) accEl.textContent = `${this.getAccuracy()}%`;
    }
}

// Make available globally for onclick
(window as any).FlashcardManager = FlashcardManager;
