import React from 'react';
import { SettingsSection } from '../SettingsSection';
import { useSettings } from '../../../hooks/useSettings';

export const AppearanceSection: React.FC = () => {
    const { settings, updateSettings } = useSettings();

    const themes = [
        { id: 'default', name: 'Standard', class: 'bg-theme-default' },
        { id: 'ocean', name: 'Ocean', class: 'bg-theme-ocean' },
        { id: 'sunset', name: 'Sunset', class: 'bg-theme-sunset' },
        { id: 'forest', name: 'Forest', class: 'bg-theme-forest' },
        // Ruby and Neon removed/replaced or kept if verified safe. 
        // User requested NO PURPLE. "Ruby" is red/pink, "Neon" might be purple. 
        // Checking premium-design.css, Rose/Ruby is reddish. Neon is... let's check.
        // I will rely on the "No Purple" rule. 
        // Safest is to stick to these for now.
    ];

    return (
        <SettingsSection
            id="appearance"
            titleSv="Utseende"
            titleAr="المظهر"
            icon="🎨"
            iconGradient="gradient-blue"
        >
            {/* Dark Mode Toggle */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">🌙</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Mörkt läge</span>
                            <span className="ar-text">الوضع الداكن</span>
                        </span>
                    </div>
                </div>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settings.darkMode}
                        onChange={(e) => updateSettings('darkMode', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {/* Color Theme */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">🎨</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Färgtema</span>
                            <span className="ar-text">لون الثيم</span>
                        </span>
                    </div>
                </div>
                <div className="color-themes">
                    {themes.map(theme => (
                        <button
                            key={theme.id}
                            type="button"
                            className={`color-btn ${theme.class} ${settings.colorTheme === theme.id ? 'active' : ''}`}
                            onClick={() => updateSettings('colorTheme', theme.id)}
                            title={theme.name}
                        />
                    ))}
                </div>
            </div>

            {/* Font Size */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">🔤</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Textstorlek</span>
                            <span className="ar-text">حجم الخط</span>
                        </span>
                    </div>
                </div>
                <div className="font-size-control">
                    <button
                        type="button"
                        className={`font-btn ${settings.fontSize === 'small' ? 'active' : ''}`}
                        onClick={() => updateSettings('fontSize', 'small')}
                    >A</button>
                    <button
                        type="button"
                        className={`font-btn ${settings.fontSize === 'medium' ? 'active' : ''}`}
                        onClick={() => updateSettings('fontSize', 'medium')}
                    >A</button>
                    <button
                        type="button"
                        className={`font-btn ${settings.fontSize === 'large' ? 'active' : ''}`}
                        onClick={() => updateSettings('fontSize', 'large')}
                    >A</button>
                </div>
            </div>

            {/* Mobile View Toggle */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">📱</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Mobilvy</span>
                            <span className="ar-text">وضع الموبايل</span>
                        </span>
                        <span className="item-sublabel">
                            <span className="sv-text">Simulera iPhone-vy</span>
                            <span className="ar-text">محاكاة شاشة آيفون</span>
                        </span>
                    </div>
                </div>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settings.mobileView}
                        onChange={(e) => updateSettings('mobileView', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {/* Animations */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">✨</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Animationer</span>
                            <span className="ar-text">الحركات</span>
                        </span>
                    </div>
                </div>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settings.animations}
                        onChange={(e) => updateSettings('animations', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>
        </SettingsSection>
    );
};
