import { useState, useEffect } from 'react';
import { StorageSync } from '../utils/storage-sync';
import { LanguageManager, Language } from '../i18n';

export interface UserSettings {
    darkMode: boolean;
    colorTheme: string;
    fontSize: string;
    animations: boolean;
    soundEffects: boolean;
    ttsSpeed: number;
    reminderEnabled: boolean;
    reminderTime: string;
    dailyGoal: number;
    autoPlay: boolean;
    showExamples: boolean;
    focusMode: boolean;
    eyeCare: boolean;
    avatar: string;
    ttsVoicePreference: 'natural' | 'male' | 'female';
    autoTraining: boolean;
    showContextInCards: boolean;
    geminiApiKey: string;
}

export interface UserProgress {
    xp: number;
    level: number;
    streak: number;
    gamesPlayed: number;
    totalScore: number;
    wordsLearned: number;
}

const DEFAULT_SETTINGS: UserSettings = {
    darkMode: true,
    colorTheme: 'default',
    fontSize: 'medium',
    animations: true,
    soundEffects: true,
    ttsSpeed: 85,
    reminderEnabled: false,
    reminderTime: '18:00',
    dailyGoal: 10,
    autoPlay: false,
    showExamples: true,
    focusMode: false,
    eyeCare: false,
    avatar: '👤',
    ttsVoicePreference: 'natural',
    autoTraining: true,
    showContextInCards: true,
    geminiApiKey: ''
};

const DEFAULT_PROGRESS: UserProgress = {
    xp: 0,
    level: 1,
    streak: 0,
    gamesPlayed: 0,
    totalScore: 0,
    wordsLearned: 0
};

export const useSettings = () => {
    // Initialize state from local storage or defaults
    const [settings, setSettingsState] = useState<UserSettings>(() => {
        const saved = localStorage.getItem('userSettings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    });

    const [progress, setProgressState] = useState<UserProgress>(() => {
        const saved = localStorage.getItem('userProgress');
        return saved ? { ...DEFAULT_PROGRESS, ...JSON.parse(saved) } : DEFAULT_PROGRESS;
    });

    const [language, setLanguageState] = useState<Language>(LanguageManager.getLanguage());

    // Sync changes to localStorage and external listeners
    const updateSettings = (key: keyof UserSettings, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettingsState(newSettings);
        localStorage.setItem('userSettings', JSON.stringify(newSettings));

        // Notify StorageSync for specific keys
        if (key === 'geminiApiKey') StorageSync.set('geminiApiKey', value);
        if (key === 'colorTheme') StorageSync.set('theme', value); // Map colorTheme to theme for compatibility

        // Apply immediate side effects
        applySideEffects(key, value);
    };

    const updateLanguage = (lang: Language) => {
        LanguageManager.setLanguage(lang);
        setLanguageState(lang);
    };

    const resetSettings = () => {
        setSettingsState(DEFAULT_SETTINGS);
        localStorage.setItem('userSettings', JSON.stringify(DEFAULT_SETTINGS));
        applyAllSideEffects(DEFAULT_SETTINGS);
        window.location.reload();
    };

    const clearData = (type: 'favorites' | 'all') => {
        if (type === 'favorites') {
            localStorage.removeItem('favorites');
        } else {
            localStorage.clear();
            // Restore defaults to avoid crash
            resetSettings();
        }
    };

    // Helper to apply side effects (DOM manipulation)
    const applySideEffects = (key: keyof UserSettings, value: any) => {
        if (key === 'darkMode') {
            document.body.classList.toggle('dark-mode', value);
            document.documentElement.classList.toggle('dark-mode', value);
            // Update CSS variables if needed (handled by CSS classes usually)
        }
        if (key === 'colorTheme') {
            document.body.setAttribute('data-theme', value);
        }
        if (key === 'fontSize') {
            document.documentElement.style.fontSize = value === 'small' ? '14px' : value === 'large' ? '18px' : '16px';
        }
        if (key === 'focusMode') {
            document.body.classList.toggle('focus-mode', value);
        }
        if (key === 'eyeCare') {
            document.body.classList.toggle('eye-care-mode', value);
        }
        if (key === 'animations') {
            document.body.classList.toggle('reduce-motion', !value);
        }
    };

    const applyAllSideEffects = (s: UserSettings) => {
        applySideEffects('darkMode', s.darkMode);
        applySideEffects('colorTheme', s.colorTheme);
        applySideEffects('fontSize', s.fontSize);
        applySideEffects('focusMode', s.focusMode);
        applySideEffects('eyeCare', s.eyeCare);
        applySideEffects('animations', s.animations);
    };

    // Initialize side effects on mount
    useEffect(() => {
        applyAllSideEffects(settings);

        // Listen for external changes (from other tabs or legacy code)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'userSettings' && e.newValue) {
                const newSettings = JSON.parse(e.newValue);
                setSettingsState({ ...DEFAULT_SETTINGS, ...newSettings });
                applyAllSideEffects(newSettings);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return {
        settings,
        progress,
        language,
        updateSettings,
        updateLanguage,
        resetSettings,
        clearData
    };
};
