import { tLang, t } from '../../i18n';
import { TTSManager } from '../../tts';
import { EmojiQuizHelper } from './EmojiQuizHelper';
import { QuizSoundManager } from './QuizSoundManager';
import { MasteryManager } from '../features/MasteryManager';
import { WeakWordsManager } from '../features/WeakWordsManager';
import { HeartExplosion } from '../ui/HeartExplosion';

/**
 * Mini Quiz Manager - EXTREME DIFFICULTY Distractor Generation
 * Uses linguistic analysis to create maximum confusion
 */
type QuizDifficulty = 'easy' | 'medium' | 'hard';

export class MiniQuizManager {
    private static difficulty: QuizDifficulty = 'medium';
    private static consecutiveCorrect = 0;

    static setDifficulty(level: QuizDifficulty) {
        this.difficulty = level;
    }

    static adjustDifficulty(isCorrect: boolean) {
        if (isCorrect) {
            this.consecutiveCorrect++;
            if (this.consecutiveCorrect >= 3 && this.difficulty !== 'hard') {
                this.setDifficulty(this.difficulty === 'easy' ? 'medium' : 'hard');
                this.consecutiveCorrect = 0;
            }
        } else {
            this.consecutiveCorrect = 0;
            if (this.difficulty !== 'easy') {
                this.setDifficulty(this.difficulty === 'hard' ? 'medium' : 'easy');
            }
        }
    }

    static getTimeLimit(): number {
        switch (this.difficulty) {
            case 'easy': return 15;
            case 'medium': return 10;
            case 'hard': return 5;
            default: return 10;
        }
    }

    private static getArabicFeatures(text: string) {
        const hasAl = text.startsWith('ال');
        const hasTaa = text.endsWith('ة');
        const hasWaw = text.includes('و');
        const hasYaa = text.endsWith('ي') || text.endsWith('ى');
        const hasPlural = text.endsWith('ون') || text.endsWith('ين') || text.endsWith('ات');
        const wordCount = text.split(' ').length;
        return { hasAl, hasTaa, hasWaw, hasYaa, hasPlural, wordCount, length: text.length };
    }

    private static similarityScore(text1: string, text2: string): number {
        const f1 = this.getArabicFeatures(text1);
        const f2 = this.getArabicFeatures(text2);

        let score = 0;
        if (f1.hasAl === f2.hasAl) score += 3;
        if (f1.hasTaa === f2.hasTaa) score += 2;
        if (f1.hasPlural === f2.hasPlural) score += 2;
        if (f1.hasYaa === f2.hasYaa) score += 1;
        if (f1.wordCount === f2.wordCount) score += 3;
        if (Math.abs(f1.length - f2.length) <= 1) score += 4;
        if (Math.abs(f1.length - f2.length) === 0) score += 3;

        if (text1.charAt(0) === text2.charAt(0)) score += 2;
        if (text1.charAt(text1.length - 1) === text2.charAt(text2.length - 1)) score += 2;

        return score;
    }

    private static swedishSimilarityScore(swe1: string, swe2: string): number {
        let score = 0;
        if (swe1.length === swe2.length) score += 10;
        else if (Math.abs(swe1.length - swe2.length) === 1) score += 5;

        if (swe1.charAt(0).toLowerCase() === swe2.charAt(0).toLowerCase()) score += 4;
        if (swe1.charAt(swe1.length - 1) === swe2.charAt(swe2.length - 1)) score += 3;

        const endings = ['ar', 'er', 'or', 'ning', 'tion', 'het', 'lig', 'isk'];
        for (const end of endings) {
            if (swe1.endsWith(end) && swe2.endsWith(end)) {
                score += 4;
                break;
            }
        }

        if (swe1.substring(0, 2).toLowerCase() === swe2.substring(0, 2).toLowerCase()) {
            score += 3;
        }

        return score;
    }

    static getSmartDistractors(wordData: any[], allData: any[][], count: number = 3): string[] {
        const type = wordData[1];
        const arb = wordData[3];

        const distractors: string[] = [];
        const used = new Set<string>([arb]);

        const candidates = allData
            .filter(row => row[3] !== arb && row[1] === type)
            .map(row => ({
                text: row[3],
                score: this.similarityScore(arb, row[3])
            }))
            .sort((a, b) => b.score - a.score);

        for (const candidate of candidates) {
            if (distractors.length >= count) break;
            if (!used.has(candidate.text)) {
                distractors.push(candidate.text);
                used.add(candidate.text);
            }
        }

        if (distractors.length < count) {
            for (const row of allData.sort(() => Math.random() - 0.5)) {
                if (distractors.length >= count) break;
                if (!used.has(row[3])) {
                    distractors.push(row[3]);
                    used.add(row[3]);
                }
            }
        }

        return distractors;
    }

    static getSwedishDistractors(wordData: any[], allData: any[][], count: number = 3): string[] {
        const type = wordData[1];
        const swe = wordData[2];

        const distractors: string[] = [];
        const used = new Set<string>([swe]);

        const candidates = allData
            .filter(row => row[2] !== swe && row[1] === type)
            .map(row => ({
                text: row[2],
                score: this.swedishSimilarityScore(swe, row[2])
            }))
            .sort((a, b) => b.score - a.score);

        for (const candidate of candidates) {
            if (distractors.length >= count) break;
            if (!used.has(candidate.text)) {
                distractors.push(candidate.text);
                used.add(candidate.text);
            }
        }

        if (distractors.length < count) {
            for (const row of allData.sort(() => Math.random() - 0.5)) {
                if (distractors.length >= count) break;
                if (!used.has(row[2])) {
                    distractors.push(row[2]);
                    used.add(row[2]);
                }
            }
        }

        return distractors;
    }

    static getEasyDistractorsSv(correct: string, allData: any[][], count: number = 3): string[] {
        return allData
            .filter(r => r[2] !== correct)
            .sort(() => Math.random() - 0.5)
            .slice(0, count)
            .map(r => r[2]);
    }

    static init(wordData: any[]) {
        const container = document.getElementById('miniQuizContainer');
        const questionEl = document.getElementById('miniQuizQuestion');
        const optionsEl = document.getElementById('miniQuizOptions');
        const feedbackEl = document.getElementById('miniQuizFeedback');

        if (!container || !questionEl || !optionsEl || !feedbackEl) return;

        const swe = wordData[2];
        const arb = wordData[3];
        const type = wordData[1];
        const exSwe = wordData[7] || '';

        const allData = (window as any).dictionaryData as any[][];

        const fallbackSwedish = ['Hus', 'Bil', 'Katt', 'Hund', 'Sol', 'Vatten', 'Bröd', 'Bok'];
        const fallbackArabic = ['بيت', 'سيارة', 'قطة', 'كلب', 'شمس', 'ماء', 'خبز', 'كتاب'];

        const getFallbackDistractors = (correct: string, isSwe: boolean): string[] => {
            const pool = isSwe ? fallbackSwedish : fallbackArabic;
            return pool.filter(w => w !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
        };

        const sweRoot = swe.substring(0, Math.min(4, swe.length)).toLowerCase();
        const hasSentence = exSwe && exSwe.length > 10 && exSwe.toLowerCase().includes(sweRoot);
        const hasEmoji = EmojiQuizHelper.hasEmoji(swe);

        const quizTypes = [2, 3];
        if (hasSentence) quizTypes.push(1);
        if (hasEmoji) quizTypes.push(4);

        const quizType = quizTypes[Math.floor(Math.random() * quizTypes.length)];

        let options: string[] = [];
        let correctAnswer: string = '';
        let questionHTML: string = '';
        let modeLabel: string = '';
        let modeIcon: string = '';

        if (quizType === 4 && hasEmoji) {
            const emoji = EmojiQuizHelper.getEmoji(swe)!;
            let distractors: string[];
            if (this.difficulty === 'easy') {
                distractors = this.getEasyDistractorsSv(swe, allData, 3);
            } else {
                distractors = allData ? this.getSwedishDistractors(wordData, allData, 3) : getFallbackDistractors(swe, true);
            }
            options = [...distractors, swe].sort(() => Math.random() - 0.5);
            correctAnswer = swe;
            questionHTML = `
                <div class="quiz-emoji-display">${emoji}</div>
                <div class="quiz-instruction"><span class="sv-text">Vilket ord passar bilden?</span><span class="ar-text">ما هي الكلمة المناسبة للصورة؟</span></div>
            `;
            modeLabel = `<span class="sv-text">Bildquiz</span><span class="ar-text">اختبار الصور</span>`;
            modeIcon = '🖼️';

        } else if (quizType === 1 && hasSentence) {
            const sentenceWithBlank = exSwe.replace(new RegExp(`\\b(${sweRoot}\\w*)\\b`, 'gi'), '______');
            const distractors = allData ? this.getSwedishDistractors(wordData, allData, 3) : getFallbackDistractors(swe, true);
            options = [...distractors, swe].sort(() => Math.random() - 0.5);
            correctAnswer = swe;
            questionHTML = `
                <div class="quiz-sentence" dir="ltr">"${sentenceWithBlank}"</div>
                <div class="quiz-instruction"><span class="sv-text">Välj rätt ord</span><span class="ar-text">اختر الكلمة الصحيحة</span></div>
            `;
            modeLabel = `<span class="sv-text">Fyll i</span><span class="ar-text">إكمال</span>`;
            modeIcon = '📝';

        } else if (quizType === 2) {
            const distractors = allData ? this.getSwedishDistractors(wordData, allData, 3) : getFallbackDistractors(swe, true);
            options = [...distractors, swe].sort(() => Math.random() - 0.5);
            correctAnswer = swe;
            questionHTML = `
                <div class="quiz-listen-container">
                    <button class="quiz-listen-btn" onclick="window.TTSManager.speak('${swe}', 'sv')">
                        🔊 <span><span class="sv-text">${tLang('btn.test', 'sv')}</span><span class="ar-text">${tLang('btn.test', 'ar')}</span></span>
                    </button>
                </div>
                <div class="quiz-instruction"><span class="sv-text">Vilket ord hörde du?</span><span class="ar-text">ما هي الكلمة التي سمعتها؟</span></div>
            `;
            modeLabel = `<span class="sv-text">Lyssna</span><span class="ar-text">استماع</span>`;
            modeIcon = '🎧';
            setTimeout(() => TTSManager.speak(swe, 'sv'), 500);

        } else {
            const isReverse = Math.random() < 0.5;
            if (isReverse) {
                const distractors = allData ? this.getSwedishDistractors(wordData, allData, 3) : getFallbackDistractors(swe, true);
                options = [...distractors, swe].sort(() => Math.random() - 0.5);
                correctAnswer = swe;
                questionHTML = `
                    <span class="sv-text">Vad är det svenska ordet för</span><span class="ar-text">ما هي الكلمة السويدية لـ</span> 
                    <strong>"${arb}"</strong>?`;
                modeLabel = `<span class="sv-text">Omvänd</span><span class="ar-text">عكسي</span>`;
                modeIcon = '🔄';
            } else {
                const distractors = allData ? this.getSmartDistractors(wordData, allData, 3) : getFallbackDistractors(arb, false);
                options = [...distractors, arb].sort(() => Math.random() - 0.5);
                correctAnswer = arb;
                questionHTML = `
                    <span class="sv-text">Vad betyder</span><span class="ar-text">ما معنى</span> 
                    <strong>"${swe}"</strong>?`;
                modeLabel = `<span class="sv-text">${type}</span><span class="ar-text">${type}</span>`;
                modeIcon = '📖';
            }
        }

        const streak = parseInt(localStorage.getItem('quizStreak') || '0');
        const xp = parseInt(localStorage.getItem('quizXP') || '0');

        questionEl.innerHTML = `
            <div class="quiz-header-row">
                <span class="quiz-word-type">${modeIcon} ${modeLabel}</span>
                <div class="quiz-stats">
                    <span class="quiz-xp">⭐ ${xp} XP</span>
                    ${streak > 0 ? `<span class="quiz-streak">🔥 ${streak}</span>` : ''}
                </div>
            </div>
            <div class="quiz-timer-bar"><div class="quiz-timer-progress"></div></div>
            ${questionHTML}
        `;

        optionsEl.innerHTML = options.map(opt => `
            <button class="quiz-option" data-value="${opt}">${opt}</button>
        `).join('') + `
            <button class="quiz-hint-btn" id="quizHintBtn" ${xp < 5 ? 'disabled' : ''}>
                💡 <span class="sv-text">Ledtråd</span><span class="ar-text">تلميح</span>
                <span class="hint-cost">(-5 XP)</span>
            </button>
        `;

        const maxTime = this.getTimeLimit();
        let timeLeft = maxTime;
        const timerProgress = questionEl.querySelector('.quiz-timer-progress') as HTMLElement;
        const timerInterval = setInterval(() => {
            timeLeft--;
            if (timerProgress) {
                const pct = (timeLeft / maxTime) * 100;
                timerProgress.style.width = `${pct}%`;
                if (pct < 30) timerProgress.style.background = '#ef4444';
                else if (pct < 60) timerProgress.style.background = '#f59e0b';
            }
            if (timeLeft <= 5 && timeLeft > 0) {
                QuizSoundManager.playTick();
            }
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                this.handleAnswer(optionsEl, feedbackEl, '', correctAnswer, wordData, false);
            }
        }, 1000);

        optionsEl.querySelectorAll('.quiz-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                clearInterval(timerInterval);
                const selected = (e.currentTarget as HTMLElement).dataset.value;
                this.handleAnswer(optionsEl, feedbackEl, selected!, correctAnswer, wordData, true);
            });
        });

        const hintBtn = optionsEl.querySelector('#quizHintBtn') as HTMLButtonElement;
        if (hintBtn) {
            hintBtn.addEventListener('click', () => {
                let currentXP = parseInt(localStorage.getItem('quizXP') || '0');
                if (currentXP < 5) return;
                currentXP -= 5;
                localStorage.setItem('quizXP', currentXP.toString());
                const xpDisplay = questionEl.querySelector('.quiz-xp');
                if (xpDisplay) xpDisplay.textContent = `⭐ ${currentXP} XP`;

                const wrongOptions = Array.from(optionsEl.querySelectorAll('.quiz-option:not(.disabled)'))
                    .filter(el => (el as HTMLElement).dataset.value !== correctAnswer);

                if (wrongOptions.length > 0) {
                    const toRemove = wrongOptions[Math.floor(Math.random() * wrongOptions.length)] as HTMLElement;
                    toRemove.classList.add('eliminated');
                    toRemove.style.opacity = '0.3';
                    toRemove.style.pointerEvents = 'none';
                    toRemove.style.textDecoration = 'line-through';
                }
                hintBtn.disabled = true;
                hintBtn.style.opacity = '0.5';
            });
        }
    }

    private static handleAnswer(
        optionsEl: HTMLElement,
        feedbackEl: HTMLElement,
        selected: string,
        correctAnswer: string,
        wordData: any[],
        userClicked: boolean
    ) {
        const isCorrect = selected === correctAnswer;
        const wordId = wordData[0].toString();

        let streak = parseInt(localStorage.getItem('quizStreak') || '0');
        let xp = parseInt(localStorage.getItem('quizXP') || '0');

        if (isCorrect) {
            streak++;
            xp += 10 + (streak * 2);
            HeartExplosion.spawn(window.innerWidth / 2, window.innerHeight / 2);
            QuizSoundManager.playCorrect();
            this.adjustDifficulty(true);
        } else {
            streak = 0;
            QuizSoundManager.playWrong();
            this.adjustDifficulty(false);
        }

        localStorage.setItem('quizStreak', streak.toString());
        localStorage.setItem('quizXP', xp.toString());

        MasteryManager.updateMastery(wordId, isCorrect);
        if (isCorrect) {
            WeakWordsManager.recordCorrect(wordId);
        } else {
            WeakWordsManager.recordWrong(wordId);
        }

        optionsEl.querySelectorAll('.quiz-option').forEach(b => {
            b.classList.add('disabled');
            if ((b as HTMLElement).dataset.value === correctAnswer) b.classList.add('correct');
            else if ((b as HTMLElement).dataset.value === selected && !isCorrect) b.classList.add('wrong');
        });

        // Use any because tLang is sometimes not exported or has different signature. 
        // Assuming tLang is imported.
        const timeUpMsg = !userClicked ? `⏰ <span class="sv-text">${tLang('details.timeUp', 'sv')}</span><span class="ar-text">${tLang('details.timeUp', 'ar')}</span>` : '';

        feedbackEl.classList.remove('hidden');

        const exampleSwe = wordData[7] || '';
        const explanations = exampleSwe ? `
            <div class="quiz-explanation">
                <div class="explanation-label">📚 <span class="sv-text">Exempel</span><span class="ar-text">مثال</span>:</div>
                <div class="explanation-text" dir="ltr">"${exampleSwe}"</div>
            </div>` : '';

        feedbackEl.innerHTML = `
            <div class="feedback-content ${isCorrect ? 'correct' : 'wrong'}">
                <div class="feedback-icon">${isCorrect ? '🎉' : '❌'}</div>
                <div class="feedback-text">
                    ${isCorrect
                ? `<span class="sv-text">Rätt svar!</span><span class="ar-text">إجابة صحيحة!</span>`
                : `<span class="sv-text">Fel svar!</span><span class="ar-text">إجابة خاطئة!</span>`
            }
                </div>
                ${timeUpMsg ? `<div class="time-up-msg">${timeUpMsg}</div>` : ''}
                ${explanations}
                <button class="next-quiz-btn" onclick="document.getElementById('miniQuizFeedback').classList.add('hidden'); MiniQuizManager.init(window.currentWordData || [])">
                    ${isCorrect
                ? `<span class="sv-text">Nästa fråga</span><span class="ar-text">السؤال التالي</span>`
                : `<span class="sv-text">Försök igen</span><span class="ar-text">حاول مرة أخرى</span>`
            } ➡️
                </button>
            </div>
        `;
    }
}
