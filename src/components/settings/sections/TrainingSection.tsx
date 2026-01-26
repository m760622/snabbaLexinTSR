import React, { useEffect, useState } from 'react';
import { SettingsSection } from '../SettingsSection';
import { useSettings } from '../../../hooks/useSettings';
import { DictionaryDB } from '../../../db'; // Assuming DB is importable, otherwise we might need dynamic import

export const TrainingSection: React.FC = () => {
    const { settings, updateSettings } = useSettings();
    const [trainingCount, setTrainingCount] = useState<number>(0);

    // Fetch training words count on mount
    useEffect(() => {
        const fetchCount = async () => {
            try {
                // Initialize DB if needed - db.ts handles init check internally
                await DictionaryDB.init();
                const words = await DictionaryDB.getTrainingWords();
                setTrainingCount(words.length);
            } catch (e) {
                console.error('Error fetching training count:', e);
            }
        };
        fetchCount();
    }, []);

    const clearTrainingList = async () => {
        if (confirm('Rensa träningslistan? / مسح قائمة التدريب؟')) {
            try {
                await DictionaryDB.clearTrainingWords();
                setTrainingCount(0);
                alert('Listan rensad / تم مسح القائمة');
            } catch (e) {
                console.error('Error clearing list:', e);
            }
        }
    };

    return (
        <SettingsSection
            id="training"
            titleSv="Smart Träning"
            titleAr="التدريب الذكي"
            icon="🧠"
            iconGradient="gradient-green"
        >
            {/* Auto Add Mistakes */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">🔄</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Auto-lägg till misstag</span>
                            <span className="ar-text">إضافة الأخطاء تلقائياً</span>
                        </span>
                        <span className="item-desc">
                            <span className="sv-text">Lägg automatiskt till fel till träningslistan</span>
                            <span className="ar-text">أضف الأخطاء تلقائياً لقائمة التدريب</span>
                        </span>
                    </div>
                </div>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settings.autoTraining}
                        onChange={(e) => updateSettings('autoTraining', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {/* Show Context */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">📝</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Visa kontext på kort</span>
                            <span className="ar-text">سياق الجمل على البطاقات</span>
                        </span>
                        <span className="item-desc">
                            <span className="sv-text">Visa exempel på flashcards</span>
                            <span className="ar-text">عرض الأمثلة على البطاقات التعليمية</span>
                        </span>
                    </div>
                </div>
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={settings.showContextInCards}
                        onChange={(e) => updateSettings('showContextInCards', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            </div>

            {/* Word Count */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">📊</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Ord i träning</span>
                            <span className="ar-text">كلمات في التدريب</span>
                        </span>
                    </div>
                </div>
                <span className="info-badge">{trainingCount}</span>
            </div>

            {/* Clear Button */}
            <div className="settings-item clickable danger" onClick={clearTrainingList} style={{ cursor: 'pointer' }}>
                <div className="item-left">
                    <span className="item-icon">🗑️</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Rensa träningslistan</span>
                            <span className="ar-text">مسح قائمة التدريب</span>
                        </span>
                    </div>
                </div>
                <svg className="item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </div>
        </SettingsSection>
    );
};
