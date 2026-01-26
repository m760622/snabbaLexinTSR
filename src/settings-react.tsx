import React from 'react';
import ReactDOM from 'react-dom/client';
import { SettingsMenu } from './components/settings/SettingsMenu';
import { StorageSync } from './utils/storage-sync';
import { LanguageManager } from './i18n';

// Initialize global services
if (typeof window !== 'undefined') {
    StorageSync.init();
    LanguageManager.init();

    // Ensure dark mode is applied immediately to avoid flash
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
        const { darkMode, colorTheme } = JSON.parse(savedSettings);
        if (darkMode) {
            document.body.classList.add('dark-mode');
            document.documentElement.classList.add('dark-mode');
        }
        if (colorTheme) {
            document.body.setAttribute('data-theme', colorTheme);
        }
    }
}

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <SettingsMenu />
        </React.StrictMode>
    );
}
