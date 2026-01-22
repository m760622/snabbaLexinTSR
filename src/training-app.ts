/**
 * Training App Entry Point
 * React-based Smart Training System
 */
import './config';
import { createRoot } from 'react-dom/client';
import React from 'react';
import TrainingView from './components/TrainingView';
import { ThemeManager } from './utils';
import { LanguageManager } from './i18n';

// Initialize theme and language first (before DOM ready for flash prevention)
ThemeManager.init();
LanguageManager.init();

// Initialize React Training System
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('training-root');
    if (!container) {
        console.error('[TrainingApp] Mount point not found');
        return;
    }

    const root = createRoot(container);
    root.render(React.createElement(TrainingView));

    console.log('[TrainingApp] Mounted successfully');
});
