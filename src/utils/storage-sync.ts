/**
 * StorageSync - Cross-context localStorage synchronization
 * Enables real-time settings updates between React and Vanilla TS parts
 */

export interface SettingsChangedEvent {
    key: string;
    value: string | null;
    oldValue: string | null;
}

// Keys to watch for changes
const WATCHED_KEYS = [
    'ttsSpeed',
    'ttsVoicePreference',
    'theme',
    'fontSize',
    'arabicFont',
    'showArabic',
    'soundEnabled'
];

export const StorageSync = {
    initialized: false,
    listeners: new Map<string, Set<(value: string | null) => void>>(),

    /**
     * Initialize storage sync - call once on app start
     */
    init() {
        if (this.initialized) return;

        // Listen for storage events from other tabs/contexts
        window.addEventListener('storage', (e) => {
            if (e.key && WATCHED_KEYS.includes(e.key)) {
                this._notifyListeners(e.key, e.newValue);

                // Dispatch global event for components
                window.dispatchEvent(new CustomEvent('settings-changed', {
                    detail: {
                        key: e.key,
                        value: e.newValue,
                        oldValue: e.oldValue
                    } as SettingsChangedEvent
                }));
            }
        });

        this.initialized = true;
        console.log('[StorageSync] Initialized');
    },

    /**
     * Subscribe to changes for a specific key
     */
    subscribe(key: string, callback: (value: string | null) => void): () => void {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key)!.add(callback);

        // Return unsubscribe function
        return () => {
            this.listeners.get(key)?.delete(callback);
        };
    },

    /**
     * Set value and notify all contexts
     */
    set(key: string, value: string) {
        const oldValue = localStorage.getItem(key);
        localStorage.setItem(key, value);

        // Notify same-page listeners (storage event doesn't fire for same page)
        if (oldValue !== value) {
            this._notifyListeners(key, value);
            window.dispatchEvent(new CustomEvent('settings-changed', {
                detail: { key, value, oldValue } as SettingsChangedEvent
            }));
        }
    },

    /**
     * Get current value with type-safe defaults
     */
    getTTSSpeed(): number {
        return parseFloat(localStorage.getItem('ttsSpeed') || '0.85');
    },

    getTTSVoicePreference(): 'natural' | 'male' | 'female' {
        return (localStorage.getItem('ttsVoicePreference') as any) || 'natural';
    },

    getTheme(): 'light' | 'dark' | 'auto' {
        return (localStorage.getItem('theme') as any) || 'dark';
    },

    getFontSize(): number {
        return parseInt(localStorage.getItem('fontSize') || '16', 10);
    },

    isSoundEnabled(): boolean {
        return localStorage.getItem('soundEnabled') !== 'false';
    },

    /** @private */
    _notifyListeners(key: string, value: string | null) {
        this.listeners.get(key)?.forEach(cb => cb(value));
    }
};

// Auto-initialize
if (typeof window !== 'undefined') {
    StorageSync.init();
    (window as any).StorageSync = StorageSync;
}
