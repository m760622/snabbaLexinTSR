import React from 'react';
import ReactDOM from 'react-dom/client';
import { SettingsMenu } from './components/settings/SettingsMenu';
import { StorageSync } from './utils/storage-sync';
import { LanguageManager } from './i18n';
import '../assets/css/settings.css'; // Ensure styles are available

let root: ReactDOM.Root | null = null;
let container: HTMLElement | null = null;

// Flag to track if we're currently initializing to prevent race conditions
let isInitializing = false;

export function initSettingsLauncher() {
    // We can use this to trigger preloading
    // Use requestIdleCallback if available, or setTimeout
    if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => preloadSettings(), { timeout: 5000 });
    } else {
        setTimeout(() => preloadSettings(), 3000);
    }
}

export function preloadSettings() {
    if (root || isInitializing) return;

    try {
        isInitializing = true;
        console.log('[Settings] Preloading React Settings...');
        ensureContainer();
        ensureRoot();
        // Render hidden
        renderSettings();
    } catch (e) {
        console.error('[Settings] Preload failed:', e);
    } finally {
        isInitializing = false;
    }
}

function ensureContainer() {
    if (!container) {
        container = document.getElementById('settings-react-overlay');
        if (!container) {
            container = document.createElement('div');
            container.id = 'settings-react-overlay';
            container.className = 'settings-modal-overlay hidden';
            document.body.appendChild(container);
        }
    }
}

function ensureRoot() {
    if (!root && container) {
        // Init services if not global
        if (!(LanguageManager as any)['instance']) LanguageManager.init();
        StorageSync.init();

        root = ReactDOM.createRoot(container);
    }
}

export function openReactSettingsModal() {
    ensureContainer();
    ensureRoot(); // Just in case preload didn't run

    // Render (or re-render to ensure state is fresh if needed, 
    // though React handles updates via props if we passed them, 
    // but here we just show/hide mostly).
    // Re-rendering is cheap if already mounted.
    renderSettings();

    // Show
    if (container) {
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
