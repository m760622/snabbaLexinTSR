
import React from 'react';
import { createRoot } from 'react-dom/client';
import { LearnLayout } from './components/Learn/LearnLayout';

// Mount function to be called when DOM is ready
export function mountLearnApp() {
    const container = document.getElementById('app');
    if (!container) {
        console.error('Failed to find #app container');
        return;
    }

    // Clear existing content if any (from vanilla JS)
    container.innerHTML = '';

    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <LearnLayout />
        </React.StrictMode>
    );
    console.log('[LearnReact] App mounted successfully');
}

// Auto-mount if this script is loaded directly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountLearnApp);
} else {
    mountLearnApp();
}
