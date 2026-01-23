import { AudioVisualizer, PronunciationRecorder, HapticFeedback, Celebrations, MasteryBadges } from '../../ui-enhancements';
import { PronunciationHelper } from '../../pronunciation-data';
import { TTSManager } from '../../tts';
import { TextSizeManager } from '../../utils';
import { LanguageManager } from '../../i18n';

/**
 * Pronunciation Lab Manager
 * مختبر النطق - يدير التفاعل الصوتي والمرئي
 */
export class PronunciationLab {
    private static visualizer: AudioVisualizer | null = null;
    private static recorder: PronunciationRecorder | null = null;
    private static currentWord: string = '';
    private static recognition: any = null;
    private static currentLevel: 'listen' | 'repeat' | 'challenge' = 'listen';

    static init(word: string) {
        this.currentWord = word;

        try {
            if (!this.visualizer) {
                // Turquoise color #2dd4bf (Teal-400) or #14b8a6 (Teal-500)
                this.visualizer = new AudioVisualizer('audioVisualizerContainer', '#2dd4bf');
                this.visualizer.setMode('liquid'); // Use wave mode as requested
            }
            if (!this.recorder) {
                this.recorder = new PronunciationRecorder();
            }

            this.setupEvents();
            this.setupPracticeLevels();
            this.renderStaticInfo();
            this.initSpeechRecognition();
        } catch (e) {
            console.warn('PronunciationLab init failed:', e);
        }
    }

    private static setupPracticeLevels() {
        const container = document.getElementById('practiceLevelsContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="practice-levels">
                <button class="practice-level-btn active" data-level="listen">
                    <span class="practice-level-icon">👂</span>
                    <span class="sv-text">Lyssna</span><span class="ar-text">استمع</span>
                </button>
                <button class="practice-level-btn" data-level="repeat">
                    <span class="practice-level-icon">🔁</span>
                    <span class="sv-text">Upprepa</span><span class="ar-text">كرر</span>
                </button>
                <button class="practice-level-btn" data-level="challenge">
                    <span class="practice-level-icon">🎯</span>
                    <span class="sv-text">Utmaning</span><span class="ar-text">تحدي</span>
                </button>
            </div>
        `;

        container.querySelectorAll('.practice-level-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.practice-level-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentLevel = (btn as HTMLElement).dataset.level as any;
                this.updateUIForLevel();
            });
        });
    }

    private static updateUIForLevel() {
        const normalBtn = document.getElementById('pronounceNormalBtn');
        const recordSection = document.getElementById('recordingSection');
        const instruction = document.getElementById('modeInstruction');

        if (this.currentLevel === 'listen') {
            normalBtn?.classList.remove('hidden');
            recordSection?.classList.add('hidden');
            if (instruction) instruction.innerHTML = '<span class="sv-text">Lyssna noga på uttalet.</span><span class="ar-text">استمع جيداً للنطق الصحيح.</span>';
        } else if (this.currentLevel === 'repeat') {
            normalBtn?.classList.remove('hidden');
            recordSection?.classList.remove('hidden');
            if (instruction) instruction.innerHTML = '<span class="sv-text">Lyssna först, spela sedan in.</span><span class="ar-text">استمع أولاً، ثم سجل صوتك.</span>';
        } else { // challenge
            normalBtn?.classList.add('hidden');
            recordSection?.classList.remove('hidden');
            if (instruction) instruction.innerHTML = '<span class="sv-text">Kan du ordet? Spela in direkt!</span><span class="ar-text">هل تعرف الكلمة؟ سجلها مباشرة!</span>';
        }
    }

    private static setupEvents() {
        const normalBtn = document.getElementById('pronounceNormalBtn');
        const recordBtn = document.getElementById('recordBtn');
        const playRecordedBtn = document.getElementById('playRecordedBtn');
        const speedSlider = document.getElementById('ttsSpeedSlider') as HTMLInputElement;
        const speedVal = document.getElementById('speedValue');
        const speedValAr = document.getElementById('speedValueAr');

        // Init Slider
        if (speedSlider) {
            const currentSpeed = TTSManager.getSpeed();
            speedSlider.value = currentSpeed.toString();
            if (speedVal) speedVal.textContent = `${currentSpeed}x`;
            if (speedValAr) speedValAr.textContent = `${currentSpeed}x`;

            speedSlider.addEventListener('input', (e) => {
                const val = parseFloat((e.target as HTMLInputElement).value);
                TTSManager.setSpeed(val);
                if (speedVal) speedVal.textContent = `${val}x`;
                if (speedValAr) speedValAr.textContent = `${val}x`;
            });

            // Listen for settings changes from other contexts (React settings page)
            window.addEventListener('settings-changed', ((e: CustomEvent) => {
                if (e.detail.key === 'ttsSpeed') {
                    const newSpeed = parseFloat(e.detail.value || '0.85');
                    speedSlider.value = newSpeed.toString();
                    if (speedVal) speedVal.textContent = `${newSpeed}x`;
                    if (speedValAr) speedValAr.textContent = `${newSpeed}x`;
                }
            }) as EventListener);
        }

        normalBtn?.addEventListener('click', () => {
            HapticFeedback.light();
            TTSManager.speakSwedish(this.currentWord);
        });

        // Repeat Button Logic
        const repeatBtn = document.getElementById('repeatBtn');
        const repeatSelect = document.getElementById('repeatCount') as HTMLSelectElement;
        let isRepeating = false;
        let stopRepeat = false;

        repeatBtn?.addEventListener('click', async () => {
            // Toggle stop if already repeating
            if (isRepeating) {
                stopRepeat = true;
                return;
            }

            HapticFeedback.medium();
            const value = repeatSelect?.value || '3';
            const isInfinite = value === 'infinite';
            const count = isInfinite ? Infinity : parseInt(value);

            isRepeating = true;
            stopRepeat = false;
            repeatBtn.classList.add('active');

            // Change button text to "Stop" during repeat
            const originalHTML = repeatBtn.innerHTML;
            repeatBtn.innerHTML = '⏹️ <span class="sv-text">Stopp</span><span class="ar-text">إيقاف</span>';

            let i = 0;
            while (i < count && !stopRepeat) {
                await new Promise<void>(resolve => {
                    TTSManager.speakSwedish(this.currentWord);
                    const onEnd = () => {
                        window.removeEventListener('tts-end', onEnd);
                        setTimeout(resolve, 800);
                    };
                    window.addEventListener('tts-end', onEnd);
                });
                i++;
            }

            // Reset button state
            isRepeating = false;
            stopRepeat = false;
            repeatBtn.classList.remove('active');
            repeatBtn.innerHTML = originalHTML;
        });

        recordBtn?.addEventListener('click', () => this.toggleRecording());

        playRecordedBtn?.addEventListener('click', async () => {
            HapticFeedback.light();
            const blob = (this as any).lastRecordedBlob;
            if (blob) PronunciationRecorder.playBlob(blob);
        });

        // TTS Events for Visualizer & Karaoke
        window.addEventListener('tts-start', () => {
            this.visualizer?.start();
            this.updateKaraokeActive(true);
            document.getElementById('audioVisualizerContainer')?.classList.add('active');
            this.startSyllableHighlight(); // Start syllable animation
        });

        window.addEventListener('tts-end', () => {
            this.visualizer?.stop();
            this.updateKaraokeActive(false);
            document.getElementById('audioVisualizerContainer')?.classList.remove('active');
            this.stopSyllableHighlight(); // Stop syllable animation
        });

        window.addEventListener('tts-boundary', (e: any) => {
            this.highlightWord(e.detail.word);
        });
    }

    private static syllableInterval: any = null;

    private static startSyllableHighlight() {
        const syllables = document.querySelectorAll('.syllable-chip');
        if (syllables.length === 0) return;

        // Clear any existing highlight
        syllables.forEach(s => s.classList.remove('active'));

        // 1. Estimate total duration based on word length and speed
        // Average speaking rate ~ 12-15 chars per second for normal speech
        // We add some buffer for startup delay
        const totalChars = this.currentWord.length;
        const speed = parseFloat(localStorage.getItem('ttsSpeed') || '0.85');

        // Base duration calculation: (Chars * ms_per_char) / speed
        // + extra time for "slower" Swedish pronunciation usually found in TTS
        const estimatedDuration = (totalChars * 80) / speed;

        // 2. Calculate duration for each syllable based on its length weight
        const syllableDurations: number[] = [];
        let totalWeight = 0;

        syllables.forEach(el => {
            const textHTML = el.textContent || '';
            const weight = Math.max(1, textHTML.length); // Min weight 1
            totalWeight += weight;
            // Store temporarily
            (el as any)._weight = weight;
        });

        // Distribute estimated duration
        syllables.forEach((el, index) => {
            const weight = (el as any)._weight;
            const duration = (weight / totalWeight) * estimatedDuration;
            syllableDurations[index] = Math.max(200, duration); // Min duration 200ms
        });

        let currentIndex = 0;

        const highlightNext = () => {
            if (currentIndex >= syllables.length) return; // Stop if done

            // Clear previous
            if (currentIndex > 0) syllables[currentIndex - 1].classList.remove('active');

            // Highlight current
            const currentEl = syllables[currentIndex];
            currentEl.classList.add('active');

            const duration = syllableDurations[currentIndex];
            currentIndex++;

            // Schedule next
            this.syllableInterval = setTimeout(highlightNext, duration);
        };

        // Start correctly
        highlightNext();
    }

    private static stopSyllableHighlight() {
        if (this.syllableInterval) {
            clearTimeout(this.syllableInterval); // Changed to clearTimeout
            this.syllableInterval = null;
        }
        // Remove all highlights
        document.querySelectorAll('.syllable-chip').forEach(s => s.classList.remove('active'));
    }

    private static renderStaticInfo() {
        // Karaoke Display
        const karaoke = document.getElementById('karaokeDisplay');
        if (karaoke) {
            karaoke.innerHTML = this.currentWord.split(' ').map((word, i) =>
                `<span class="karaoke-word" data-word-index="${i}">${word}</span>`
            ).join(' ');

            // Apply text auto-sizing for long words
            karaoke.setAttribute('data-auto-size', '');
            karaoke.setAttribute('data-max-lines', '1');
            setTimeout(() => TextSizeManager.apply(karaoke, this.currentWord, 1, 2.5), 50); // Base size 2.5rem
        }

        // Syllables
        const syllableDisplay = document.getElementById('syllableDisplay');
        if (syllableDisplay) {
            const syllables = PronunciationHelper.splitIntoSyllables(this.currentWord);
            syllableDisplay.innerHTML = syllables.map(s => `<span class="syllable-chip" data-auto-size data-max-lines="1">${s}</span>`).join('');
            // Apply text size after rendering
            setTimeout(() => TextSizeManager.applyToContainer(syllableDisplay), 50);
        }

        // Tips
        const tipsArea = document.getElementById('phoneticTipsArea');
        if (tipsArea) {
            const tips = PronunciationHelper.getTipsForWord(this.currentWord);
            tipsArea.innerHTML = tips.map(tip => `
                <div class="tip-card">
                    <div class="tip-title">💡 <span class="sv-text">Tips</span><span class="ar-text">نصيحة</span></div>
                    <div class="tip-text">${LanguageManager.getLanguage() === 'sv' ? tip.tip.sv : tip.tip.ar}</div>
                    <div class="tip-ex">Ex: ${tip.example}</div>
                </div>
            `).join('');
        }
    }

    private static highlightWord(word: string) {
        const karaoke = document.getElementById('karaokeDisplay');
        if (!karaoke) return;

        const spans = karaoke.querySelectorAll('.karaoke-word');
        spans.forEach(span => {
            const spanWord = span.textContent?.toLowerCase().replace(/[.,!?;:]/g, '');
            const targetWord = word.toLowerCase().replace(/[.,!?;:]/g, '');

            if (spanWord === targetWord) {
                span.classList.add('active');
                setTimeout(() => span.classList.remove('active'), 800);
            }
        });
    }

    private static updateKaraokeActive(active: boolean) {
        const karaoke = document.getElementById('karaokeDisplay');
        if (karaoke) {
            if (active) karaoke.classList.add('playing');
            else karaoke.classList.remove('playing');
        }
    }

    private static isRecording = false;
    private static async toggleRecording() {
        const recordBtn = document.getElementById('recordBtn');
        const feedback = document.getElementById('recordingFeedback');
        const playback = document.getElementById('playbackArea');
        const labSection = document.querySelector('.pronunciation-lab-section');

        if (!this.isRecording) {
            // Start
            this.isRecording = true;
            recordBtn?.classList.add('active');
            recordBtn!.innerHTML = `⏹️ <span class="sv-text">Stoppa</span><span class="ar-text">إيقاف</span>`;
            feedback?.classList.remove('hidden');
            playback?.classList.add('hidden');
            labSection?.classList.add('recording');

            this.visualizer?.start();
            document.querySelector('.audio-visualizer-canvas')?.classList.add('recording');
            await this.recorder?.start();
            this.startSpeechRecognition();
        } else {
            // Stop
            this.isRecording = false;
            recordBtn?.classList.remove('active');
            recordBtn!.innerHTML = `🎙️ <span class="sv-text">Spela in</span><span class="ar-text">تسجيل</span>`;
            feedback?.classList.add('hidden');
            labSection?.classList.remove('recording');
            document.querySelector('.audio-visualizer-canvas')?.classList.remove('recording');

            this.visualizer?.stop();
            const blob = await this.recorder?.stop();
            (this as any).lastRecordedBlob = blob;
            playback?.classList.remove('hidden');

            this.stopSpeechRecognition();
        }
    }

    private static initSpeechRecognition() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'sv-SE';
        this.recognition.interimResults = false;
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event: any) => {
            const spokenText = event.results[0][0].transcript.toLowerCase();
            const confidence = event.results[0][0].confidence;
            this.calculateScore(spokenText, confidence);
        };
    }

    private static startSpeechRecognition() {
        if (this.recognition) {
            try { this.recognition.start(); } catch (e) { }
        }
    }

    private static stopSpeechRecognition() {
        if (this.recognition) {
            try { this.recognition.stop(); } catch (e) { }
        }
    }

    private static calculateScore(spoken: string, confidence: number) {
        const target = this.currentWord.toLowerCase();
        let score = 0;

        if (spoken === target) {
            score = Math.round(confidence * 100);
        } else {
            if (spoken.includes(target) || target.includes(spoken)) {
                score = Math.round(confidence * 80);
            } else {
                score = Math.round(confidence * 40);
            }
        }

        const scoreEl = document.getElementById('pronunciationScore');
        const badgeContainer = document.getElementById('masteryBadgeContainer');
        const labSection = document.querySelector('.pronunciation-lab-section');

        if (scoreEl) {
            scoreEl.innerHTML = `⭐ <span class="sv-text">Resultat: ${score}%</span><span class="ar-text">النتيجة: ${score}%</span>`;

            // Show success state
            if (score > 50) {
                labSection?.classList.add('success');
                setTimeout(() => labSection?.classList.remove('success'), 2000);
            }

            // High score celebration with gold particles
            if (score > 80) {
                // Confetti removed per user request
                HapticFeedback.success();
                this.showGoldParticles();
            }

            // Render mastery badge
            if (badgeContainer) {
                badgeContainer.innerHTML = ''; // Clear previous
                MasteryBadges.renderBadge(score, badgeContainer);
            }
        }
    }

    private static showGoldParticles() {
        const container = document.getElementById('audioVisualizerContainer');
        if (!container) return;

        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'gold-particle';
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 0.5}s`;
            container.appendChild(particle);

            setTimeout(() => particle.remove(), 1500);
        }
    }
}
