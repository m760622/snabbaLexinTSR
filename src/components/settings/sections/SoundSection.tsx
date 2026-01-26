import React from 'react';
import { SettingsSection } from '../SettingsSection';
import { useSettings } from '../../../hooks/useSettings';

export const SoundSection: React.FC = () => {
    const { settings, updateSettings } = useSettings();

    const handleTestTTS = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance('Hej, välkommen till SnabbaLexin!');
            utterance.lang = 'sv-SE';
            utterance.rate = settings.ttsSpeed / 100;
            // Select voice based on preference if available
            // Note: Voice selection is complex in browsers, keeps it simple for now
            speechSynthesis.speak(utterance);
        }
    };

    return (
        <SettingsSection
            id="sound"
            titleSv="Ljud & Notiser"
            titleAr="الصوت والإشعارات"
            icon="🔔"
            iconGradient="gradient-blue"
        >
            {/* Sound Effects */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">🔊</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Ljudeffekter</span>
                            <span className="ar-text">المؤثرات الصوتية</span>
                        </span>
                    </div>
                </div>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settings.soundEffects}
                        onChange={(e) => updateSettings('soundEffects', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {/* TTS Speed */}
            <div className="settings-item slider-item">
                <div className="item-left">
                    <span className="item-icon">🗣️</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Uttalshastighet</span>
                            <span className="ar-text">سرعة النطق</span>
                        </span>
                    </div>
                </div>
                <div className="slider-control">
                    <input
                        type="range"
                        min="50"
                        max="150"
                        value={settings.ttsSpeed}
                        onChange={(e) => updateSettings('ttsSpeed', parseInt(e.target.value))}
                    />
                    <span className="slider-value">{settings.ttsSpeed}%</span>
                </div>
            </div>

            {/* Voice Preference */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">🎭</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Rösttyp</span>
                            <span className="ar-text">نوع الصوت</span>
                        </span>
                    </div>
                </div>
                <div className="voice-selector">
                    <button
                        type="button"
                        className={`voice-btn ${settings.ttsVoicePreference === 'natural' ? 'active' : ''}`}
                        onClick={() => updateSettings('ttsVoicePreference', 'natural')}
                        title="Naturlig / طبيعي"
                    >🌍</button>
                    <button
                        type="button"
                        className={`voice-btn ${settings.ttsVoicePreference === 'female' ? 'active' : ''}`}
                        onClick={() => updateSettings('ttsVoicePreference', 'female')}
                        title="Kvinna / أنثى"
                    >👩</button>
                    <button
                        type="button"
                        className={`voice-btn ${settings.ttsVoicePreference === 'male' ? 'active' : ''}`}
                        onClick={() => updateSettings('ttsVoicePreference', 'male')}
                        title="Man / ذكر"
                    >👨</button>
                </div>
            </div>

            {/* Test TTS */}
            <div className="settings-item center-item">
                <button type="button" className="test-btn" onClick={handleTestTTS}>
                    <span>🔊</span>
                    <span className="sv-text">Testa uttal</span>
                    <span className="ar-text">اختبر النطق</span>
                </button>
            </div>

            {/* Daily Reminder */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">⏰</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Daglig påminnelse</span>
                            <span className="ar-text">تذكير يومي</span>
                        </span>
                    </div>
                </div>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settings.reminderEnabled}
                        onChange={(e) => updateSettings('reminderEnabled', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {/* Reminder Time */}
            {settings.reminderEnabled && (
                <div className="settings-item">
                    <div className="item-left">
                        <span className="item-icon">🕐</span>
                        <div className="item-info">
                            <span className="item-name">
                                <span className="sv-text">Påminnelsetid</span>
                                <span className="ar-text">وقت التذكير</span>
                            </span>
                        </div>
                    </div>
                    <input
                        type="time"
                        className="time-input"
                        value={settings.reminderTime}
                        onChange={(e) => updateSettings('reminderTime', e.target.value)}
                    />
                </div>
            )}
        </SettingsSection>
    );
};
