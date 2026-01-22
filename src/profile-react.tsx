import React from 'react';
import { createRoot } from 'react-dom/client';
import UserProfile from './components/UserProfile';

/**
 * Profile React Entry Point
 * Mounts the UserProfile component to #profile-root
 */
function initProfileReact(): void {
    const container = document.getElementById('profile-root');
    if (!container) {
        console.error('[ProfileReact] Mount point #profile-root not found');
        return;
    }

    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <UserProfile />
        </React.StrictMode>
    );

    console.log('[ProfileReact] Mounted successfully');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProfileReact);
} else {
    initProfileReact();
}

export { initProfileReact };
