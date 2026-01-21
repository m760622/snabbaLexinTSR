export class SoundManager {
    private static instance: SoundManager;
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;

    // Cache audio buffers
    private sounds: Map<string, HTMLAudioElement> = new Map();

    private constructor() {
        // Preload sounds if possible
        this.preloadSounds();
    }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    private preloadSounds() {
        const soundFiles = {
            'correct': 'assets/sounds/correct.mp3',
            'wrong': 'assets/sounds/wrong.mp3',
            'win': 'assets/sounds/win.mp3',
            'streak': 'assets/sounds/streak.mp3'
        };

        Object.entries(soundFiles).forEach(([key, path]) => {
            const audio = new Audio(path);
            audio.preload = 'auto'; // Attempt to preload
            this.sounds.set(key, audio);
        });
    }

    public async play(soundName: 'correct' | 'wrong' | 'win' | 'streak') {
        if (!this.enabled) return;

        try {
            const audio = this.sounds.get(soundName);
            if (audio) {
                // Reset time to 0 to allow rapid replay
                audio.currentTime = 0;
                await audio.play();
            } else {
                console.warn(`[SoundManager] Sound not found: ${soundName}`);
            }
        } catch (e) {
            // Auto-play policy or missing file
            console.warn(`[SoundManager] Play failed:`, e);
            // If file missing (NotSupportedError or 404), disable that sound to prevent spam
            if (e instanceof Error && (e.name === 'NotSupportedError' || e.message.includes('404'))) {
                this.sounds.delete(soundName);
                console.warn(`[SoundManager] Disabled sound '${soundName}' due to loading error.`);
            }
        }
    }

    public toggleSound(enabled: boolean) {
        this.enabled = enabled;
    }
}
