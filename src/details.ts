import './config';
// import './loader'; // Optimized: Load only specific word
import { DictionaryDB } from './db';
import { ThemeManager, showToast, TextSizeManager } from './utils';
import { TTSManager } from './tts';
import { FavoritesManager } from './favorites';
import { QuizStats } from './quiz-stats';
import { t, tLang, LanguageManager } from './i18n';
import { AudioVisualizer, PronunciationRecorder, HapticFeedback, Celebrations, MasteryBadges } from './ui-enhancements';
import { PronunciationHelper } from './pronunciation-data';
import { TypeColorSystem } from './type-color-system';
import { StorageSync } from './utils/storage-sync';

// Feature Modules
import { HeartExplosion } from './details/ui/HeartExplosion';
import { SmartCardManager } from './details/ui/SmartCardManager';
import { SmartLinkProcessor } from './details/utils/SmartLinkProcessor';
import { NotesManager } from './details/features/NotesManager';
import { PronunciationLab } from './details/features/PronunciationLab';
import { MiniQuizManager } from './details/quiz/MiniQuizManager';
import { QuizSoundManager } from './details/quiz/QuizSoundManager';
import { EmojiQuizHelper } from './details/quiz/EmojiQuizHelper';








/**
 * Smart Link Processor - Linkifies definitions
 */


/**
 * Personal Notes Manager
 */


/**
 * Quiz Sound Manager - Web Audio API for feedback sounds
 */


/**
 * Emoji Quiz Helper - Maps words to emojis for "Picture" Quiz
 */


/**
 * Mini Quiz Manager - EXTREME DIFFICULTY Distractor Generation
 * Uses linguistic analysis to create maximum confusion
 */
type QuizDifficulty = 'easy' | 'medium' | 'hard';



import { SwipeNavigator } from './details/ui/SwipeNavigator';
import { RelatedWordsManager } from './details/features/RelatedWordsManager';
import { FlashcardManager } from './details/features/FlashcardManager';
import { MasteryManager } from './details/features/MasteryManager';
import { DailyStreakManager } from './details/features/DailyStreakManager';
import { MotivationManager } from './details/features/MotivationManager';
import { WeakWordsManager } from './details/features/WeakWordsManager';
import { ShareManager } from './details/utils/ShareManager';

// Re-export for global usage if needed (though modules are preferred)
(window as any).MiniQuizManager = MiniQuizManager;
(window as any).SwipeNavigator = SwipeNavigator;
(window as any).RelatedWordsManager = RelatedWordsManager;
(window as any).FlashcardManager = FlashcardManager;
(window as any).MasteryManager = MasteryManager;
(window as any).DailyStreakManager = DailyStreakManager;
(window as any).MotivationManager = MotivationManager;
(window as any).WeakWordsManager = WeakWordsManager;
(window as any).ShareManager = ShareManager;



/**
 * Details Screen Manager
 */
export class DetailsManager {
    private wordId: string | null = null;
    private wordData: any[] | null = null;

    constructor() {
        this.init();
    }

    private async init() {
        const params = new URLSearchParams(window.location.search);
        this.wordId = params.get('id');

        if (!this.wordId) {
            window.location.href = 'index.html';
            return;
        }

        this.setupGeneralListeners();
        this.setupTabListeners();

        // Efficient Loading:
        // 1. Init DB connection
        // 2. Try direct lookup (Fastest)
        // 3. Only fallback to full load if absolutely necessary (or load in background)

        try {
            await DictionaryDB.init();
            const cachedWord = await DictionaryDB.getWordById(this.wordId);

            if (cachedWord) {
                this.wordData = cachedWord;
                // Render immediately
                this.renderDetails();
                QuizStats.recordStudy(this.wordId!);
                NotesManager.init(this.wordId!);

                // Background load for advanced features (related words etc)
                this.loadBackgroundData();
                return;
            }
        } catch (e) {
            console.warn('[Details] Cache lookup failed:', e);
        }

        // Fallback: DISABLED as per user request (Cache First & Only)
        console.warn('[Details] Word not in cache. Fallback disabled.');
        /*
        if ((window as any).dictionaryData) {
            this.handleDataReady();
        } else {
            // Lazy load the loader only if absolutely needed
            import('./loader').then(({ Loader }) => {
                window.addEventListener('dictionaryLoaded', () => this.handleDataReady());
            });
        }
        */
    }

    private async loadBackgroundData() {
        // Load partial data or full dictionary in background for "Related Words" etc.
        // For now, we just check if we have data or need to fetch constraints

        if ((window as any).dictionaryData) {
            this.initDeferredFeatures();
        } else {
            // Optional: You could fetch just related words here instead of full dict
            // For now, let's just init what we can
            this.initDeferredFeatures();
        }
    }

    private initDeferredFeatures() {
        if (!this.wordData) return;

        const detailsArea = document.getElementById('detailsArea');
        if (detailsArea) {
            MasteryManager.renderMasteryBar(this.wordId!, detailsArea);
            DailyStreakManager.renderStreakBadge(detailsArea);
        }

        // These need full dictionary to be perfect, but we can try with what we have
        // or wait for a background thread.
        // For performance, we can skip complex distractors if data is missing
        if ((window as any).dictionaryData) {
            MiniQuizManager.init(this.wordData);
            RelatedWordsManager.init(this.wordData);
            SwipeNavigator.init(this.wordId!);
            FlashcardManager.init(this.wordData);
        } else {
            // Minimal init without full data
            // RelatedWordsManager requires full data... skip or mock?
            // Let's rely on cached mini-quiz if possible or disable
            const noteSection = document.querySelector('.notes-section');
            if (noteSection) MotivationManager.renderQuote(noteSection as HTMLElement);
        }
    }

    private setupGeneralListeners() {
        const themeBtn = document.getElementById('themeToggleBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', () => ThemeManager.toggle());
        }
    }

    private setupTabListeners() {
        const tabBtns = document.querySelectorAll('.details-tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        // Initial state sync
        tabContents.forEach(c => {
            const isInfo = (c as HTMLElement).dataset.tab === 'info';
            (c as HTMLElement).style.display = isInfo ? 'block' : 'none';
        });

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = (btn as HTMLElement).dataset.tab;

                tabBtns.forEach(b => b.classList.toggle('active', b === btn));
                tabContents.forEach(c => {
                    const isTarget = (c as HTMLElement).dataset.tab === targetTab;
                    c.classList.toggle('active', isTarget);
                    // Fallback: Force visibility in JS to override CSS issues
                    (c as HTMLElement).style.display = isTarget ? 'block' : 'none';
                });

                // Re-init features if target is play tab (just in case)
                if (targetTab === 'play' && this.wordData) {
                    MiniQuizManager.init(this.wordData);
                    // Optimized: Only init if not already initialized for this word to avoid overhead?
                    // actually PronunciationLab.init is light enough and handles re-init.
                    PronunciationLab.init(this.wordData[2]);
                }
            });
        });
    }

    private async handleDataReady() {
        const data = (window as any).dictionaryData as any[][];
        if (!data) return;

        this.wordData = data.find(row => row[0].toString() === this.wordId) || null;

        if (!this.wordData) {
            this.wordData = await DictionaryDB.getWordById(this.wordId!);
        }

        if (this.wordData) {
            QuizStats.recordStudy(this.wordId!);
            this.renderDetails();

            // Init new professional features
            NotesManager.init(this.wordId!);
            MiniQuizManager.init(this.wordData);
            RelatedWordsManager.init(this.wordData);
        } else {
            const area = document.getElementById('detailsArea');
            if (area) area.innerHTML = '<div class="placeholder-message"><span class="sv-text">Ordet hittades inte</span><span class="ar-text">الكلمة غير موجودة</span></div>';
        }
    }

    private renderDetails() {
        const row = this.wordData!;
        const id = row[0].toString();
        const type = row[1];
        const swe = row[2];
        const arb = row[3];
        const arbExt = row[4] || '';
        const def = row[5] || '';
        const forms = row[6] || '';
        const exSwe = row[7] || '';
        const exArb = row[8] || '';
        const idiomSwe = row[9] || '';
        const idiomArb = row[10] || '';

        const gender = row[13] || ''; // en/ett from dictionary

        const category = TypeColorSystem.getCategory(type, swe, forms, gender, arb);
        const isFav = FavoritesManager.has(id);
        const glowClass = TypeColorSystem.getGlowClass(type, swe, forms, gender, arb);

        this.setupHeaderActions(row, isFav);

        const detailsArea = document.getElementById('detailsArea');
        if (!detailsArea) return;

        const grammarBadge = TypeColorSystem.generateBadge(type, swe, forms, gender, arb);

        // Process definition and examples for smart links
        const processedDef = SmartLinkProcessor.process(def);
        const processedExSwe = SmartLinkProcessor.process(exSwe);
        const processedIdiomSwe = SmartLinkProcessor.process(idiomSwe);

        // Apply dynamic color to Tabs Container for localized glow
        const tabsContainer = document.querySelector('.details-tabs');
        if (tabsContainer) {
            tabsContainer.className = 'details-tabs ' + glowClass;
        }

        // Apply dynamic color to Sticky Header for blurred background
        const stickyHeader = document.querySelector('.details-header-sticky');
        if (stickyHeader) {
            stickyHeader.className = 'details-header details-header-sticky ' + glowClass;
        }

        // Minimalist Hero HTML - Matching Flashcard-Clean style
        let html = `
            <!-- Hero Section with Type Glow -->
            <div class="details-hero ${glowClass} premium-border-animated">
                <div class="hero-inner">
                    <h1 class="word-swe-hero">${swe}</h1>
                    <div class="hero-divider"></div>
                    <p class="word-arb-hero" dir="rtl">${arb}</p>
                    ${arbExt ? `<p class="word-arb-ext" dir="rtl">${arbExt}</p>` : ''}
                </div>
                
                <div class="word-meta-row">
                    <span class="word-type-pill">
                        <span class="sv-text">${type}</span>
                        <span class="sv-text ar-text"> / </span>
                        <span class="ar-text">${tLang('quran.' + type.toLowerCase().replace('substantiv', 'noun'), 'ar') || type}</span>
                    </span>
                    ${grammarBadge}
                </div>
            </div>

            <div class="details-content-grid">
                ${forms ? `
                <div class="details-section">
                    <h3 class="section-title"><span class="section-icon">🔗</span> <span class="sv-text">Böjningar</span><span class="ar-text">التصريفات</span></h3>
                    <div class="forms-card-container">
                        <div class="forms-container">
                            ${forms.split(',').map((f: string) => `<span class="form-chip">${f.trim()}</span>`).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}

                ${(def || arbExt) ? `
                <div class="details-section">
                    <h3 class="section-title"><span class="section-icon">📝</span> <span class="sv-text">Betydelse</span><span class="ar-text">المعنى</span></h3>
                    <div class="definition-card">
                        ${def ? `<p class="def-text">${processedDef}</p>` : ''}
                        ${arbExt ? `<p class="def-text" dir="rtl" style="margin-top: 10px; border-top: 1px solid var(--border); padding-top: 10px;">${arbExt}</p>` : ''}
                    </div>
                </div>
                ` : ''}

                ${(exSwe || exArb) ? `
                <div class="details-section">
                    <h3 class="section-title"><span class="section-icon">💡</span> <span class="sv-text">Exempel</span><span class="ar-text">أمثلة</span></h3>
                    <div class="example-card">
                        ${exSwe ? `<div class="ex-swe-detail" dir="ltr">${processedExSwe}</div>` : ''}
                        ${exArb ? `<div class="ex-arb-detail" dir="rtl">${exArb}</div>` : ''}
                    </div>
                </div>
                ` : ''}

                ${(idiomSwe || idiomArb) ? `
                <div class="details-section">
                    <h3 class="section-title"><span class="section-icon">💬</span> <span class="sv-text">Uttryck</span><span class="ar-text">تعابير</span></h3>
                    <div class="example-card idiom-card">
                        ${idiomSwe ? `<div class="ex-swe-detail" dir="ltr">${processedIdiomSwe}</div>` : ''}
                        ${idiomArb ? `<div class="ex-arb-detail" dir="rtl">${idiomArb}</div>` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        detailsArea.innerHTML = html;

        // Setup Smart Link listeners
        SmartLinkProcessor.setupListeners(detailsArea);

        // Dynamic text sizing
        const sweEl = detailsArea.querySelector('.word-swe-hero');
        if (sweEl) TextSizeManager.apply(sweEl as HTMLElement, swe);

        const arbEl = detailsArea.querySelector('.word-arb-hero');
        if (arbEl) TextSizeManager.apply(arbEl as HTMLElement, arb);

        detailsArea.querySelectorAll('.def-text, .ex-swe-detail, .ex-arb-detail').forEach(el => {
            TextSizeManager.apply(el as HTMLElement, el.textContent || '');
        });

        // Dynamic page title
        const lang = LanguageManager.getLanguage();
        if (lang === 'sv') document.title = `${swe} - SnabbaLexin`;
        else if (lang === 'ar') document.title = `${arb} - سنابا لكسين`;
        else document.title = `${swe} | ${arb} - SnabbaLexin`;

        // Initialize Pronunciation Lab
        setTimeout(() => {
            PronunciationLab.init(swe);
            // SmartCardManager.init(detailsArea); // Disabled: User requested full text always
        }, 100);

        // 3D Parallax Effect for Hero
        let heroRect: DOMRect | null = null;

        // Clear cache on resize
        window.addEventListener('resize', () => {
            heroRect = null;
        });

        detailsArea.addEventListener('mouseenter', () => {
            const hero = detailsArea.querySelector('.hero-inner') as HTMLElement;
            if (hero) heroRect = hero.getBoundingClientRect();
        }, { capture: true }); // Capture to ensure we get it early

        detailsArea.addEventListener('mousemove', (e) => {
            const hero = detailsArea.querySelector('.hero-inner') as HTMLElement;
            if (!hero) return;

            // Fallback if not captured on enter (e.g. initial load under mouse)
            if (!heroRect) heroRect = hero.getBoundingClientRect();

            const x = e.clientX - heroRect.left;
            const y = e.clientY - heroRect.top;

            requestAnimationFrame(() => {
                const centerX = heroRect!.width / 2;
                const centerY = heroRect!.height / 2;

                const rotateX = ((y - centerY) / centerY) * -10;
                const rotateY = ((x - centerX) / centerX) * 10;

                hero.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
        });

        detailsArea.addEventListener('mouseleave', () => {
            const hero = detailsArea.querySelector('.hero-inner') as HTMLElement;
            if (hero) {
                hero.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
            }
            heroRect = null;
        });

        // Double Tap to Love (Heart Explosion)
        const heroSection = detailsArea.querySelector('.details-hero');
        if (heroSection) {
            heroSection.addEventListener('dblclick', (e: Event) => {
                const me = e as MouseEvent;
                HeartExplosion.spawn(me.clientX, me.clientY);

                // Trigger Favorite Toggle
                const favBtn = document.getElementById('headerFavoriteBtn');
                if (favBtn) favBtn.click();
            });
        }
    }

    private setupHeaderActions(row: any[], isFav: boolean) {
        const swe = row[2];
        const id = row[0].toString();
        const isLocal = id.startsWith('local_') || id.length > 20;

        const audioBtn = document.getElementById('headerAudioBtn');
        if (audioBtn) audioBtn.onclick = () => TTSManager.speak(swe, 'sv');

        const favBtn = document.getElementById('headerFavoriteBtn');
        if (favBtn) {
            FavoritesManager.updateButtonIcon(favBtn, isFav);
            favBtn.onclick = () => this.toggleFavorite(id, favBtn);
        }

        const trainBtn = document.getElementById('headerTrainingBtn');
        if (trainBtn) {
            // Init state
            DictionaryDB.isWordMarkedForTraining(id).then(isTraining => {
                trainBtn.innerHTML = isTraining ? '🧠' : '💪';
                trainBtn.classList.toggle('active', isTraining);
                trainBtn.setAttribute('aria-label', isTraining ? 'Ta bort från träning / إزالة من التدريب' : 'Lägg till i träning / إضافة للتدريب');
            });

            trainBtn.onclick = async () => {
                const currentState = trainBtn.classList.contains('active');
                const newState = !currentState;

                // Optimistic UI
                trainBtn.classList.toggle('active');
                trainBtn.innerHTML = newState ? '🧠' : '💪';
                trainBtn.setAttribute('aria-label', newState ? 'Ta bort från träning / إزالة من التدريب' : 'Lägg till i träning / إضافة للتدريب');

                // Animate
                const heart = document.createElement('div');
                heart.innerHTML = newState ? '🧠' : '💨';
                heart.className = 'heart-particle'; // Reuse existing class for floating effect
                const rect = trainBtn.getBoundingClientRect();
                heart.style.left = (rect.left + rect.width / 2) + 'px';
                heart.style.top = (rect.top + rect.height / 2) + 'px';
                document.body.appendChild(heart);
                setTimeout(() => heart.remove(), 1000);

                await DictionaryDB.updateTrainingStatus(id, newState);

                if (newState) {
                    showToast('Tillagd i träning / تمت الإضافة للتدريب');
                } else {
                    showToast('Borttagen från träning / تمت الإزالة من التدريب');
                }
            };
        }

        const flashBtn = document.getElementById('headerFlashcardBtn');
        if (flashBtn) {
            flashBtn.onclick = () => {
                window.location.href = `games/flashcards.html?id=${id}`;
            };
        }

        const customActions = document.getElementById('customActions');
        if (customActions) {
            customActions.style.display = isLocal ? 'flex' : 'none';
        }

        const editBtn = document.getElementById('editBtn');
        if (editBtn) {
            editBtn.onclick = () => {
                window.location.href = `add.html?edit=${id}`;
            };
        }

        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) {
            deleteBtn.onclick = async () => {
                if (confirm(t('details.confirmDelete'))) {
                    await DictionaryDB.deleteWord(id);
                    showToast('<span class="sv-text">Ordet borttaget</span><span class="ar-text">تم حذف الكلمة</span>');
                    setTimeout(() => window.location.href = 'index.html', 1000);
                }
            };
        }

        const copyBtn = document.getElementById('smartCopyBtn');
        if (copyBtn) {
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(swe).then(() => showToast('<span class="sv-text">Kopierat</span><span class="ar-text">تم النسخ</span> 📋'));
            };
        }

        const shareBtn = document.getElementById('headerShareBtn');
        if (shareBtn) {
            shareBtn.onclick = () => {
                const currentLang = LanguageManager.getLanguage();
                const text = currentLang === 'ar'
                    ? `📚 تعلمت كلمة جديدة!\n\n🇸🇪 ${swe}\n🇸🇦 ${row[3]}\n\n#SnabbaLexin`
                    : `📚 Jag lärde mig ett nytt ord!\n\n🇸🇪 ${swe}\n🇸🇦 ${row[3]}\n\n#SnabbaLexin`;

                if (navigator.share) {
                    navigator.share({
                        title: `Lexin: ${swe}`,
                        text: text,
                        url: window.location.href
                    }).catch(console.error);
                } else {
                    navigator.clipboard.writeText(window.location.href).then(() => showToast(`<span class="sv-text">Länk kopierad</span><span class="ar-text">تم نسخ الرابط</span> 🔗`));
                }
            };
        }
    }

    private toggleFavorite(id: string, btn: HTMLElement) {
        const isFavNow = FavoritesManager.toggle(id);
        FavoritesManager.updateButtonIcon(btn, isFavNow);
    }


}

// Instantiate
if (typeof window !== 'undefined') {
    (window as any).detailsManager = new DetailsManager();
}
