import React from 'react';
import { SettingsSection } from '../SettingsSection';
import { useSettings } from '../../../hooks/useSettings';

export const ApiSection: React.FC = () => {
    const { settings, updateSettings } = useSettings();

    return (
        <SettingsSection
            id="api"
            titleSv="Gemini API"
            titleAr="مفتاح Gemini API"
            icon="🔑"
            iconGradient="gradient-blue"
        >
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">🔐</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Gemini API-nyckel</span>
                            <span className="ar-text">مفتاح Gemini API</span>
                        </span>
                        <span className="item-description">
                            <span className="sv-text">Används för AI-funktioner i träningen</span>
                            <span className="ar-text">يُستخدم للوظائف الذكية في التدريب</span>
                        </span>
                    </div>
                </div>
                <input
                    type="password"
                    className="settings-input password-input"
                    placeholder="Skriv din API-nyckel här / اكتب مفتاح API هنا"
                    maxLength={100}
                    spellCheck={false}
                    value={settings.geminiApiKey}
                    onChange={(e) => updateSettings('geminiApiKey', e.target.value)}
                />
            </div>
        </SettingsSection>
    );
};
