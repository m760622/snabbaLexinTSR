import React from 'react';
import { SettingsSection } from '../SettingsSection';

export const NavigationSection: React.FC = () => {
    return (
        <SettingsSection
            id="navigation"
            titleSv="Snabbnavigering"
            titleAr="التنقل السريع"
            icon="🧭"
            iconGradient="gradient-amber"
        >
            <div className="quick-links-grid">
                <a href="games/games.html" className="quick-link-card">
                    <span className="quick-link-icon">🎮</span>
                    <span className="quick-link-label">
                        <span className="sv-text">Spel</span>
                        <span className="ar-text">ألعاب</span>
                    </span>
                </a>
                <a href="learn/learn.html" className="quick-link-card">
                    <span className="quick-link-icon">📖</span>
                    <span className="quick-link-label">
                        <span className="sv-text">Grammatik</span>
                        <span className="ar-text">القواعد</span>
                    </span>
                </a>
                <a href="profile.html" className="quick-link-card">
                    <span className="quick-link-icon">👤</span>
                    <span className="quick-link-label">
                        <span className="sv-text">Min Profil</span>
                        <span className="ar-text">ملفي</span>
                    </span>
                </a>
                <a href="add.html" className="quick-link-card">
                    <span className="quick-link-icon">➕</span>
                    <span className="quick-link-label">
                        <span className="sv-text">Lägg till</span>
                        <span className="ar-text">إضافة</span>
                    </span>
                </a>
            </div>
        </SettingsSection>
    );
};
