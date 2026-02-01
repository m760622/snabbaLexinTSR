import React from 'react';
import { createRoot } from 'react-dom/client';
import 'virtual:uno.css';
import { LanguageAgent } from './components/LanguageAgent';

// Mount function to be called when DOM is ready
export function mountLanguageAgent() {
    // Check if container exists, create if not
    let container = document.getElementById('language-agent-root');
    if (!container) {
        container = document.createElement('div');
        container.id = 'language-agent-root';
        document.body.appendChild(container);
    }

    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <LanguageAgent />
        </React.StrictMode>
    );
    console.log('[LanguageAgent] Component mounted successfully');
}

// Auto-mount
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountLanguageAgent);
} else {
    mountLanguageAgent();
}
