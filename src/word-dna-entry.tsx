import React from 'react';
import { createRoot } from 'react-dom/client';
import { WordDNA } from './features/word-dna/WordDNA';
import { LanguageManager } from './i18n';

// Initialize language and styles
LanguageManager.init();

const container = document.getElementById('word-dna-root');
if (container) {
    const root = createRoot(container);
    // Passing a dummy onClose since it's a standalone page and we have the back button in HTML
    root.render(<WordDNA onClose={() => window.history.back()} />);
}
