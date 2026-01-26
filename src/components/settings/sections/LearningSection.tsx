import React from 'react';
import { SettingsSection } from '../SettingsSection';
import { useSettings } from '../../../hooks/useSettings';

export const LearningSection: React.FC = () => {
    const { settings, updateSettings } = useSettings();

    return (
        <SettingsSection
            id="learning"
            titleSv="Lärverktyg"
            titleAr="أدوات التعلم"
            icon="📚"
            iconGradient="gradient-green"
        >
            {/* Daily Goal */}
            <div className="settings-item slider-item">
                <div className="item-left">
                    <span className="item-icon">🎯</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Dagligt mål</span>
                            <span className="ar-text">الهدف اليومي</span>
                        </span>
                    </div>
                </div>
                <div className="goal-selector">
                    {[5, 10, 20, 50].map(goal => (
                        <button
                            key={goal}
                            type="button"
                            className={`goal-btn ${settings.dailyGoal === goal ? 'active' : ''}`}
                            onClick={() => updateSettings('dailyGoal', goal)}
                        >
                            {goal}
                        </button>
                    ))}
                </div>
            </div>

            {/* Auto Play */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">▶️</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Auto-spela ljud</span>
                            <span className="ar-text">تشغيل الصوت تلقائياً</span>
                        </span>
                    </div>
                </div>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settings.autoPlay}
                        onChange={(e) => updateSettings('autoPlay', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {/* Show Examples */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">💬</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Visa exempel</span>
                            <span className="ar-text">عرض الأمثلة</span>
                        </span>
                    </div>
                </div>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settings.showExamples}
                        onChange={(e) => updateSettings('showExamples', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {/* Focus Mode */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">🧘</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Fokusläge</span>
                            <span className="ar-text">وضع التركيز</span>
                        </span>
                    </div>
                </div>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settings.focusMode}
                        onChange={(e) => updateSettings('focusMode', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {/* Eye Care */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">👁️</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Ögonvård</span>
                            <span className="ar-text">حماية العين</span>
                        </span>
                    </div>
                </div>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settings.eyeCare}
                        onChange={(e) => updateSettings('eyeCare', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>
        </SettingsSection>
    );
};
