/**
 * Full-Screen Settings Modal - Midnight Aurora Bento Edition
 * UI/UX Pro Max Standard
 */

// Generate full settings modal HTML (Bento Grid Structure)
export function generateSettingsModalHTML(): string {
    return `
        <div id="settingsModal" class="settings-modal hidden">
            <!-- Modal Container (Bento Box) -->
            <div class="settings-modal-container">
                
                <!-- Header -->
                <header class="settings-modal-header">
                    <button type="button" class="settings-modal-close" id="closeSettingsModal" aria-label="Stäng / إغلاق">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <div class="settings-modal-title">
                        <h1><span class="sv-text">Inställningar</span><span class="ar-text">الإعدادات</span></h1>
                    </div>
                    <button type="button" id="resetAllBtnModal" class="settings-modal-close" title="Återställ / إعادة تعيين" aria-label="Reset All Settings">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                    </button>
                </header>

                <!-- Scrollable Bento Grid Content -->
                <div class="settings-modal-content">
                    
                    <!-- 1. Profile Card (Large span-8) -->
                    <div class="bento-card card-profile delay-100">
                        <div class="profile-avatar-large" id="profileAvatarModal">
                            <span class="avatar-emoji">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </span>
                        </div>
                        <div class="profile-details">
                            <h2 class="profile-name"><span class="sv-text">Gäst</span><span class="ar-text">زائر</span></h2>
                            <div class="profile-stats-row">
                                <span class="stat-pill">
                                    <span class="sv-text">Nivå</span> <strong id="userLevelModal">1</strong>
                                </span>
                                <span class="stat-pill">
                                    <strong id="userXPModal">0</strong> XP
                                </span>
                                <span class="stat-pill">
                                    🔥 <strong id="currentStreakModal">0</strong>
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Language Selection (span-4) -->
                    <div class="bento-card card-language delay-200">
                         <div class="section-header-bento">
                            <span class="section-icon-bento gradient-indigo">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            </span>
                            <span class="section-title-bento"><span class="sv-text">Språk</span><span class="ar-text">اللغة</span></span>
                        </div>
                        <div class="lang-toggles">
                            <button class="lang-btn" data-lang="sv" aria-label="Select Swedish Only">🇸🇪 SV</button>
                            <button class="lang-btn active" data-lang="both" aria-label="Select Both Languages">🌍 Alla</button>
                            <button class="lang-btn" data-lang="ar" aria-label="Select Arabic Only">🇸🇦 AR</button>
                        </div>
                    </div>

                    <!-- 3. Navigation Links (Quick Actions) (span-12) -->
                    <div class="bento-card card-section delay-300" style="grid-column: span 12; display:flex; flex-direction:row; justify-content:space-around; align-items:center; padding: 16px;">
                        <a href="games/games.html" class="quick-link-card" style="text-align:center; color:white; text-decoration:none;">
                            <div class="link-icon-bg" style="background:rgba(255,255,255,0.1); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin:0 auto 8px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>
                            </div>
                            <span class="sv-text" style="font-size:0.8rem;">Spel</span>
                        </a>
                        <a href="learn/learn.html" class="quick-link-card" style="text-align:center; color:white; text-decoration:none;">
                            <div class="link-icon-bg" style="background:rgba(255,255,255,0.1); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin:0 auto 8px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                            </div>
                            <span class="sv-text" style="font-size:0.8rem;">Lär dig</span>
                        </a>
                        <a href="profile.html" class="quick-link-card" style="text-align:center; color:white; text-decoration:none;">
                            <div class="link-icon-bg" style="background:rgba(255,255,255,0.1); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin:0 auto 8px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </div>
                            <span class="sv-text" style="font-size:0.8rem;">Profil</span>
                        </a>
                        <a href="add.html" class="quick-link-card" style="text-align:center; color:white; text-decoration:none;">
                            <div class="link-icon-bg" style="background:rgba(255,255,255,0.1); width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; margin:0 auto 8px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                            </div>
                            <span class="sv-text" style="font-size:0.8rem;">Lägg till</span>
                        </a>
                    </div>

                    <!-- 4. Appearance (span-6) -->
                    <div class="bento-card card-section delay-400">
                        <div class="section-header-bento">
                            <span class="section-icon-bento gradient-cyan">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>
                            </span>
                            <span class="section-title-bento"><span class="sv-text">Utseende</span><span class="ar-text">المظهر</span></span>
                        </div>
                        <!-- Dark Mode -->
                        <div class="setting-row">
                            <div class="setting-label">
                                <svg xmlns="http://www.w3.org/2000/svg" class="setting-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                                <span class="sv-text">Mörkt läge</span>
                            </div>
                            <label class="bento-toggle" aria-label="Toggle Dark Mode">
                                <input type="checkbox" id="darkModeToggleModal" class="hide-input" checked>
                                <span class="bento-toggle-slider"></span>
                            </label>
                        </div>
                        <!-- Color Theme (Simplified to circles) -->
                        <div class="setting-row">
                            <div class="setting-label">
                                <svg xmlns="http://www.w3.org/2000/svg" class="setting-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
                                <span class="sv-text">Tema</span>
                            </div>
                            <div class="color-themes" id="colorThemesModal" style="display:flex; gap:6px;">
                                <button type="button" class="color-btn active bg-theme-default" data-theme="default" aria-label="Teal Theme" style="width:20px; height:20px; border-radius:50%; border:1px solid white; background:#2dd4bf;"></button>
                                <button type="button" class="color-btn bg-theme-ocean" data-theme="ocean" aria-label="Ocean Theme" style="width:20px; height:20px; border-radius:50%; border:1px solid rgba(255,255,255,0.3); background:#0ea5e9;"></button>
                                <button type="button" class="color-btn bg-theme-rose" data-theme="rose" aria-label="Rose Theme" style="width:20px; height:20px; border-radius:50%; border:1px solid rgba(255,255,255,0.3); background:#f43f5e;"></button>
                            </div>
                        </div>
                        <!-- Animation -->
                        <div class="setting-row">
                            <div class="setting-label">
                                <svg xmlns="http://www.w3.org/2000/svg" class="setting-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                                <span class="sv-text">Motion</span>
                            </div>
                            <label class="bento-toggle" aria-label="Toggle Animations">
                                <input type="checkbox" id="animationsToggleModal" class="hide-input" checked>
                                <span class="bento-toggle-slider"></span>
                            </label>
                        </div>
                    </div>

                    <!-- 5. Sound (span-6) -->
                    <div class="bento-card card-section delay-400">
                        <div class="section-header-bento">
                            <span class="section-icon-bento gradient-blue">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                            </span>
                            <span class="section-title-bento"><span class="sv-text">Ljud</span><span class="ar-text">الصوت</span></span>
                        </div>
                        <!-- Sound Effects -->
                        <div class="setting-row">
                            <div class="setting-label">
                                <svg xmlns="http://www.w3.org/2000/svg" class="setting-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
                                <span class="sv-text">Effekter</span>
                            </div>
                            <label class="bento-toggle" aria-label="Toggle Sound Effects">
                                <input type="checkbox" id="soundEffectsToggleModal" class="hide-input" checked>
                                <span class="bento-toggle-slider"></span>
                            </label>
                        </div>
                        <!-- TTS Speed -->
                        <div class="setting-row">
                            <div class="setting-label">
                                <svg xmlns="http://www.w3.org/2000/svg" class="setting-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/></svg>
                                <span class="sv-text">Hastighet</span>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="font-size:0.8rem; color:var(--text-muted);" id="ttsSpeedValueModal">85%</span>
                                <input type="range" id="ttsSpeedSliderModal" min="50" max="150" value="85" style="width:80px; height:4px; border-radius:2px; accent-color:var(--aurora-1);" aria-label="TTS Speed">
                            </div>
                        </div>
                        <!-- Test Button -->
                        <div class="setting-row" style="justify-content:center; padding-top:12px;">
                             <button type="button" class="test-btn" id="testTTSBtnModal" style="background:rgba(255,255,255,0.1); border:none; color:white; padding:6px 16px; border-radius:12px; font-size:0.85rem; cursor:pointer;">
                                🔊 <span class="sv-text">Testa röst</span>
                             </button>
                        </div>
                    </div>

                    <!-- 6. Learning (span-6) -->
                    <div class="bento-card card-section delay-500">
                        <div class="section-header-bento">
                            <span class="section-icon-bento gradient-green">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            </span>
                            <span class="section-title-bento"><span class="sv-text">Lärande</span></span>
                        </div>
                        <!-- Auto Play -->
                        <div class="setting-row">
                            <div class="setting-label">
                                <svg xmlns="http://www.w3.org/2000/svg" class="setting-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="10 8 16 12 10 16 10 8"/></svg>
                                <span class="sv-text">Auto-spela</span>
                            </div>
                            <label class="bento-toggle" aria-label="Toggle Auto Play">
                                <input type="checkbox" id="autoPlayToggleModal" class="hide-input">
                                <span class="bento-toggle-slider"></span>
                            </label>
                        </div>
                        <!-- Focus Mode -->
                        <div class="setting-row">
                            <div class="setting-label">
                                <svg xmlns="http://www.w3.org/2000/svg" class="setting-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                                <span class="sv-text">Fokus</span>
                            </div>
                            <label class="bento-toggle" aria-label="Toggle Focus Mode">
                                <input type="checkbox" id="focusModeToggleModal" class="hide-input">
                                <span class="bento-toggle-slider"></span>
                            </label>
                        </div>
                        <!-- Daily Goal -->
                        <div class="setting-row">
                             <div class="setting-label">
                                <svg xmlns="http://www.w3.org/2000/svg" class="setting-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                <span class="sv-text">Mål</span>
                            </div>
                            <div class="goal-selector" style="display:flex; gap:4px;">
                                <button class="goal-btn active" data-goal="10" aria-label="10 Cards Goal" style="background:var(--aurora-1); border:none; border-radius:6px; padding:2px 8px; color:black; font-weight:bold; font-size:0.8rem;">10</button>
                                <button class="goal-btn" data-goal="20" aria-label="20 Cards Goal" style="background:rgba(255,255,255,0.1); border:none; border-radius:6px; padding:2px 8px; color:white; font-size:0.8rem;">20</button>
                            </div>
                        </div>
                    </div>

                    <!-- 7. Data & Reset (span-6) -->
                    <div class="bento-card card-section delay-500">
                        <div class="section-header-bento">
                            <span class="section-icon-bento gradient-rose">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </span>
                            <span class="section-title-bento"><span class="sv-text">Data</span></span>
                        </div>
                         <div class="setting-row" id="exportDataBtnModal" style="cursor:pointer;" role="button" tabindex="0" aria-label="Export Data">
                            <div class="setting-label">
                                <svg xmlns="http://www.w3.org/2000/svg" class="setting-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                <span class="sv-text">Exportera</span>
                            </div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                         <div class="setting-row" id="clearAllDataBtnModal" style="cursor:pointer; color:#f43f5e;" role="button" tabindex="0" aria-label="Clear All Data">
                            <div class="setting-label" style="color:#f43f5e;">
                                <svg xmlns="http://www.w3.org/2000/svg" class="setting-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
                                <span class="sv-text">Rensa allt</span>
                            </div>
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                    </div>
                    
                    <!-- 8. About (span 12) -->
                     <div class="bento-card card-footer delay-500">
                        <p class="footer-text">SnabbaLexin v3.0 • Premium Edition</p>
                        <p class="footer-text" style="font-size: 0.75rem; opacity: 0.7;">Made with ❤️ for language learners</p>
                    </div>

                </div>
            </div>
        </div>
    `;
}

// Initialize the settings modal
export function initSettingsModal(): void {
    const settingsBtn = document.getElementById('settingsBtn');
    if (!settingsBtn) return;

    // Convert link to button behavior
    settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openSettingsModal();
    });
}

export function openSettingsModal(): void {
    // Inject modal HTML if not already done OR if missing from DOM
    const existingModal = document.getElementById('settingsModal');
    if (!existingModal) {
        document.body.insertAdjacentHTML('beforeend', generateSettingsModalHTML());
        initSettingsModalHandlers();
    }

    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('hidden');
        // Trigger generic animation if needed or just opacity transition from CSS
        document.body.style.overflow = 'hidden';
        loadSettingsState();
    }
}

export function closeSettingsModal(): void {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function initSettingsModalHandlers(): void {
    // Close button
    const closeBtn = document.getElementById('closeSettingsModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSettingsModal);
    }

    // Backdrop click (target settings-modal itself as it is the overlay)
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeSettingsModal();
            }
        });
    }

    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggleModal') as HTMLInputElement;
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            const theme = darkModeToggle.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            updateUserSettings('darkMode', darkModeToggle.checked);

            // Visual feedback
            const parentLabel = darkModeToggle.closest('.bento-toggle');
            if (parentLabel) {
                parentLabel.classList.toggle('toggled-on', darkModeToggle.checked);
            }
        });
    }

    // TTS Speed
    const ttsSlider = document.getElementById('ttsSpeedSliderModal') as HTMLInputElement;
    const ttsValue = document.getElementById('ttsSpeedValueModal');
    if (ttsSlider && ttsValue) {
        ttsSlider.addEventListener('input', () => {
            ttsValue.textContent = `${ttsSlider.value}%`;
            localStorage.setItem('ttsSpeed', ttsSlider.value);
            updateUserSettings('ttsSpeed', parseInt(ttsSlider.value));
        });
    }

    // Language buttons (Bento Style: .lang-btn)
    document.querySelectorAll('.settings-modal .lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang') || 'both';
            document.querySelectorAll('.settings-modal .lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            localStorage.setItem('appLanguage', lang);
            if ((window as any).LanguageManager) {
                (window as any).LanguageManager.setLanguage(lang);
            }
            updateUserSettings('language', lang);
        });
    });

    // Color Theme buttons
    document.querySelectorAll('.settings-modal .color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme') || 'default';
            document.querySelectorAll('.settings-modal .color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (theme !== 'default') {
                document.documentElement.setAttribute('data-color-theme', theme);
            } else {
                document.documentElement.removeAttribute('data-color-theme');
            }
            localStorage.setItem('colorTheme', theme);
            updateUserSettings('colorTheme', theme);
        });
    });

    // Goal buttons
    document.querySelectorAll('.settings-modal .goal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.settings-modal .goal-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const goal = parseInt(btn.getAttribute('data-goal') || '10');
            localStorage.setItem('dailyGoal', String(goal));
            updateUserSettings('dailyGoal', goal);
        });
    });

    // Toggle handlers for checkboxes
    initToggleHandler('animationsToggleModal', 'animations', (checked) => {
        document.body.classList.toggle('reduce-motion', !checked);
    });
    initToggleHandler('soundEffectsToggleModal', 'soundEffects');
    initToggleHandler('autoPlayToggleModal', 'autoPlay');
    initToggleHandler('focusModeToggleModal', 'focusMode', (checked) => {
        document.body.classList.toggle('focus-mode', checked);
    });

    // Note: Other toggles that were removed from the compact Bento design can still be handled if re-added later.
    // I kept the most popular ones for the "Pro" look.

    // Test TTS button
    const testTTSBtn = document.getElementById('testTTSBtnModal');
    if (testTTSBtn) {
        testTTSBtn.addEventListener('click', () => {
            // Mock TTS call
            console.log("Speaking...");
            if ('speechSynthesis' in window) {
                const msg = new SpeechSynthesisUtterance("Hej, detta är ett test.");
                msg.lang = 'sv-SE';
                window.speechSynthesis.speak(msg);
            }
        });
    }
}

function initToggleHandler(elementId: string, settingKey: string, callback?: (checked: boolean) => void): void {
    const toggle = document.getElementById(elementId) as HTMLInputElement;
    if (toggle) {
        toggle.addEventListener('change', () => {
            updateUserSettings(settingKey, toggle.checked);

            // Visual feedback update (class toggle on parent)
            const parentLabel = toggle.closest('.bento-toggle');
            if (parentLabel) {
                parentLabel.classList.toggle('toggled-on', toggle.checked);
            }

            callback?.(toggle.checked);
        });

        // Initial state sync
        const parentLabel = toggle.closest('.bento-toggle');
        if (parentLabel) {
            parentLabel.classList.toggle('toggled-on', toggle.checked);
        }
    }
}

function updateUserSettings(key: string, value: any): void {
    try {
        const saved = localStorage.getItem('userSettings');
        const settings = saved ? JSON.parse(saved) : {};
        settings[key] = value;
        localStorage.setItem('userSettings', JSON.stringify(settings));
    } catch (e) {
        console.error('Failed to sync settings:', e);
    }
}

function loadSettingsState(): void {
    try {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');

        // Dark Mode
        const darkModeToggle = document.getElementById('darkModeToggleModal') as HTMLInputElement;
        if (darkModeToggle) {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            darkModeToggle.checked = isDark;
            const parentLabel = darkModeToggle.closest('.bento-toggle');
            if (parentLabel) {
                parentLabel.classList.toggle('toggled-on', isDark);
            }
        }

        // TTS Speed
        const ttsSlider = document.getElementById('ttsSpeedSliderModal') as HTMLInputElement;
        const ttsValue = document.getElementById('ttsSpeedValueModal');
        if (ttsSlider && ttsValue) {
            const speed = settings.ttsSpeed || 85;
            ttsSlider.value = String(speed);
            ttsValue.textContent = `${speed}%`;
        }

        // Language
        const lang = settings.language || localStorage.getItem('appLanguage') || 'both';
        document.querySelectorAll('.settings-modal .lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });

        // Color Theme
        const colorTheme = settings.colorTheme || localStorage.getItem('colorTheme') || 'default';
        document.querySelectorAll('.settings-modal .color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-theme') === colorTheme);
        });

        // Goal
        const goal = String(settings.dailyGoal || 10);
        document.querySelectorAll('.settings-modal .goal-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-goal') === goal);
        });

        // Toggles
        loadToggleState('soundEffectsToggleModal', settings.soundEffects !== false);
        loadToggleState('animationsToggleModal', settings.animations !== false);
        loadToggleState('autoPlayToggleModal', settings.autoPlay);
        loadToggleState('focusModeToggleModal', settings.focusMode);

    } catch (e) {
        console.error('Failed to load settings state:', e);
    }
}

function loadToggleState(elementId: string, value: boolean): void {
    const toggle = document.getElementById(elementId) as HTMLInputElement;
    if (toggle) {
        toggle.checked = !!value;
        const parentLabel = toggle.closest('.bento-toggle');
        if (parentLabel) {
            parentLabel.classList.toggle('toggled-on', !!value);
        }
    }
}
