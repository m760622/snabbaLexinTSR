import React, { useEffect, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';
import { ProfileCard } from './ProfileCard';
import { Recommendations } from './Recommendations';
import { GeneralSection } from './sections/GeneralSection';
import { AppearanceSection } from './sections/AppearanceSection';
import { SoundSection } from './sections/SoundSection';
import { LearningSection } from './sections/LearningSection';
import { TrainingSection } from './sections/TrainingSection';
import { NavigationSection } from './sections/NavigationSection';
import { ApiSection } from './sections/ApiSection';
import { DataSection } from './sections/DataSection';
import { AboutSection } from './sections/AboutSection';
import { ToastManager } from '../../toast-manager'; // Assuming we can use this or need a React wrapper

// Helper to use Toast in React
const showToast = (msg: string) => {
    // Dispatch event for existing ToastManager to catch if it listens, 
    // or we can import the logic. The existing ToastManager is a singleton class.
    // We'll trust the singleton if initialized, otherwise fallback to alert or nothing.
    // For now, let's try assuming the global one works or window dispatch.
    // Actually, let's use a simple React effect/portal if needed, but existing ToastManager works via DOM.
    // We can just call ToastManager.show() if it exports a static instance or singleton.
    // In settings.ts it imported { ToastManager } from './toast-manager'.
    // Let's assume it works.
};

export const SettingsMenu: React.FC = () => {
    const { settings, resetSettings } = useSettings();
    const [completion, setCompletion] = useState(0);

    // Calculate completion
    useEffect(() => {
        let completed = 0;
        const total = 9; // Approx

        if (settings.darkMode !== undefined) completed++;
        if (settings.colorTheme !== 'default') completed++;
        if (settings.soundEffects) completed++;
        if (settings.reminderEnabled) completed++;
        if (settings.dailyGoal > 5) completed++;
        if (settings.ttsSpeed !== 85) completed++;
        if (settings.avatar !== '👤') completed++;
        if (settings.showExamples) completed++;
        if (settings.animations) completed++;
        // Base

        setCompletion(Math.round((completed / total) * 100));
    }, [settings]);

    return (
        <div className="settings-container">
            {/* Header */}
            <header className="settings-header">
                <a href="index.html" className="settings-back-btn" aria-label="Tillbaka / رجوع">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </a>
                <div className="settings-header-title">
                    <h1>
                        <span className="sv-text">Inställningar</span>
                        <span className="ar-text">الإعدادات</span>
                    </h1>
                </div>
                <div className="settings-header-actions">
                    <button
                        type="button"
                        className="settings-reset-btn"
                        title="Återställ / إعادة تعيين"
                        onClick={() => {
                            if (confirm('Återställ inställningar? / إعادة تعيين الإعدادات؟')) {
                                resetSettings();
                            }
                        }}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                    </button>
                </div>
            </header>

            <ProfileCard />

            {/* Completion Indicator */}
            <div className="settings-completion glass-card">
                <div className="completion-icon">🎯</div>
                <div className="completion-info">
                    <span className="completion-label">
                        <span className="sv-text">Inställningar klara</span>
                        <span className="ar-text">اكتملت الإعدادات</span>
                    </span>
                    <span className="completion-value">{completion}%</span>
                </div>
                <div className="completion-bar-bg">
                    <div className="completion-bar-fill" style={{ width: `${completion}%` }}></div>
                </div>
            </div>

            <Recommendations />

            <div className="settings-sections">
                <GeneralSection />
                <AppearanceSection />
                <SoundSection />
                <LearningSection />
                <TrainingSection />
                <NavigationSection />
                <ApiSection />
                <DataSection />
                <AboutSection />
            </div>

            {/* Footer */}
            <footer className="settings-footer">
                <div className="motivation-card glass-card">
                    <span className="motivation-icon">💪</span>
                    <p className="motivation-text">
                        <span className="sv-text">Du gör fantastiska framsteg! Fortsätt lära dig.</span>
                        <span className="ar-text">أنت تحقق تقدماً رائعاً! استمر في التعلم.</span>
                    </p>
                </div>
            </footer>
        </div>
    );
};
