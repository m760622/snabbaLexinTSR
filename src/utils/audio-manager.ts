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
        if (this.activeContext && this.activeContext.state !== 'closed') {
            this.activeContext.close().catch(() => { });
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
     * Stop all audio playback
     */
    stopAll() {
        this.cleanup();

        // Also cancel speech synthesis
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }
};

// Global access and page cleanup
if (typeof window !== 'undefined') {
    (window as any).AudioManager = AudioManager;

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        AudioManager.cleanup();
    });

    // Clean up when page becomes hidden (mobile tab switch)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            AudioManager.stopAll();
        }
    });
}
