import React from 'react';
import ReactDOM from 'react-dom/client';
import { SettingsMenu } from './components/settings/SettingsMenu';
import { StorageSync } from './utils/storage-sync';
import { LanguageManager } from './i18n';
import '../assets/css/settings.css'; // Ensure styles are available

let root: ReactDOM.Root | null = null;
let container: HTMLElement | null = null;

export function initSettingsLauncher() {
    // We don't need to do much here, just ensure we can trigger it later
    // Could pre-create container if improved performance needed
}

export function openReactSettingsModal() {
    // 1. Ensure Container Exists
    if (!container) {
        container = document.getElementById('settings-react-overlay');
        if (!container) {
            container = document.createElement('div');
            container.id = 'settings-react-overlay';
            container.className = 'settings-modal-overlay hidden';
            document.body.appendChild(container);

            // Add styles for overlay if not in CSS
            // Or assume .settings-modal-overlay is styled
            // Styles handled by CSS class .settings-modal-overlay

        }
    }

    // 2. Ensure React Root Exists
    if (!root && container) {
        // Init services if not global
        // Init services if not global
        if (!(LanguageManager as any)['instance']) LanguageManager.init(); // Safe check
        StorageSync.init();

        root = ReactDOM.createRoot(container);
        renderSettings();
    }

    // 3. Show
    if (container) {
        // Simple visibility toggle
        container.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Lock scroll
    }
}

export function closeReactSettingsModal() {
    if (container) {
        container.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function renderSettings() {
    if (root) {
        root.render(
            <React.StrictMode>
                <SettingsMenu
                    displayMode="modal"
                    onClose={closeReactSettingsModal}
                />
            </React.StrictMode>
        );
    }
}
