/**
 * AudioManager - Centralized audio resource management
 * Prevents memory leaks by cleaning up old Audio objects before new playback
 */

export const AudioManager = {
    activeAudio: null as HTMLAudioElement | null,
    activeContext: null as AudioContext | null,
    cleanupQueue: new Set<HTMLAudioElement>(),

    /**
     * Clean up current audio resources
     */
    cleanup() {
        // Clean active audio
        if (this.activeAudio) {
            try {
                this.activeAudio.pause();
                this.activeAudio.src = '';
                this.activeAudio.load(); // Reset audio element
            } catch (e) { /* ignore cleanup errors */ }
            this.activeAudio = null;
        }

        // Clean AudioContext
        // We generally keep the context open for performance unless explicitly stopped
        if (this.activeContext && this.activeContext.state === 'closed') {
            this.activeContext = null;
        }

        // Clean queued audio elements
        this.cleanupQueue.forEach(audio => {
            try {
                audio.pause();
                audio.src = '';
            } catch (e) { /* ignore */ }
        });
        this.cleanupQueue.clear();
    },

    /**
     * Play audio with automatic cleanup of previous
     */
    play(audio: HTMLAudioElement): Promise<void> {
        this.cleanup();
        this.activeAudio = audio;
        return audio.play();
    },

    /**
     * Create and track a new Audio element
     */
    createAudio(src?: string): HTMLAudioElement {
        this.cleanup();
        const audio = new Audio(src);
        this.activeAudio = audio;
        return audio;
    },

    /**
     * Track an audio element for later cleanup
     */
    track(audio: HTMLAudioElement) {
        this.cleanupQueue.add(audio);
    },

    /**
     * Get or create AudioContext with cleanup tracking
     */
    getAudioContext(): AudioContext {
        if (this.activeContext && this.activeContext.state !== 'closed') {
            return this.activeContext;
        }

        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.activeContext = new AudioContextClass();
        return this.activeContext!;
    },

    /**
     * Plays a synthetic "Success / Ta-da" sound using Web Audio API
     * Major chord arpeggio (C-E-G) + slight shimmer
     */
    playSuccessSound() {
        try {
            const ctx = this.getAudioContext();
            if (ctx.state === 'suspended') ctx.resume();

            const t = ctx.currentTime;

            // Notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
            const frequencies = [523.25, 659.25, 783.99, 1046.50];

            frequencies.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = i === 3 ? 'sine' : 'triangle'; // High note pure sine, others triangle for warmth
                osc.frequency.setValueAtTime(freq, t + i * 0.1); // Arpeggio effect

                gain.gain.setValueAtTime(0, t + i * 0.1);
                gain.gain.linearRampToValueAtTime(0.1, t + i * 0.1 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.6); // Decay

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(t + i * 0.1);
                osc.stop(t + i * 0.1 + 0.61);
            });

        } catch (e) {
            console.warn('Audio play failed', e);
        }
    },

    /**
     * Plays a synthetic "Click / Tick" sound for swipe feedback
     * Short high burst
     */
    playClickSound() {
        try {
            const ctx = this.getAudioContext();
            if (ctx.state === 'suspended') ctx.resume();

            const t = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            // High pitch pop
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(100, t + 0.05);

            gain.gain.setValueAtTime(0.05, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(t);
            osc.stop(t + 0.051);
        } catch (e) {
            console.warn('Click play failed', e);
        }
    },

    /**
     * Stop all audio playback
     */
    stopAll() {
        // Clean active audio
        if (this.activeAudio) {
            try {
                this.activeAudio.pause();
                this.activeAudio.src = '';
            } catch (e) { /* ignore */ }
            this.activeAudio = null;
        }

        // Close context to stop all synthetic sounds
        if (this.activeContext && this.activeContext.state !== 'closed') {
            this.activeContext.close().catch(() => { });
            this.activeContext = null;
        }

        // Also cancel speech synthesis
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }

        this.cleanupQueue.clear();
    }
};

// Global access and page cleanup
if (typeof window !== 'undefined') {
    (window as any).AudioManager = AudioManager;

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        AudioManager.stopAll();
    });

    // Clean up when page becomes hidden (mobile tab switch)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            AudioManager.stopAll();
        }
    });
}
