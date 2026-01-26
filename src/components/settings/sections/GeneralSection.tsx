import React from 'react';
import { SettingsSection } from '../SettingsSection';
import { useSettings } from '../../../hooks/useSettings';
import { Language } from '../../../i18n';

export const GeneralSection: React.FC = () => {
    const { language, updateLanguage } = useSettings();

    const handleLangChange = (lang: Language) => {
        updateLanguage(lang);
    };

    return (
        <SettingsSection
            id="general"
            titleSv="Allmänt"
            titleAr="عام"
            icon="🌍"
            iconGradient="gradient-amber"
            defaultExpanded={true}
        >
            <div className="language-selection-container">
                <h4 className="settings-subtitle">
                    <span className="sv-text">Välj Språk</span>
                    <span className="ar-text">اختر اللغة</span>
                </h4>
                <div className="language-grid-premium" id="languageSelector">
                    <button
                        type="button"
                        className={`lang-card-premium ${language === 'sv' ? 'active' : ''}`}
                        onClick={() => handleLangChange('sv')}
                    >
                        <span className="lang-flag-large">🇸🇪</span>
                        <span className="lang-name-large">Svenska</span>
                        <span className="lang-check">✓</span>
                    </button>
                    <button
                        type="button"
                        className={`lang-card-premium ${language === 'ar' ? 'active' : ''}`}
                        onClick={() => handleLangChange('ar')}
                    >
                        <span className="lang-flag-large">🇸🇦</span>
                        <span className="lang-name-large">العربية</span>
                        <span className="lang-check">✓</span>
                    </button>
                    <button
                        type="button"
                        className={`lang-card-premium ${language === 'both' ? 'active' : ''}`}
                        onClick={() => handleLangChange('both')}
                    >
                        <span className="lang-flag-large">🌍</span>
                        <span className="lang-name-large">
                            <span className="sv-text">Båda</span>
                            <span className="ar-text">كلتا</span>
                        </span>
                        <span className="lang-check">✓</span>
                    </button>
                </div>
            </div>
        </SettingsSection>
    );
};
