import React from 'react';
import { useSettings } from '../../hooks/useSettings';

export const Recommendations: React.FC = () => {
    const { settings, updateSettings } = useSettings();

    const recommendations = [];

    if (!settings.soundEffects) {
        recommendations.push({
            id: 'sound',
            icon: '🔊',
            textSv: 'Aktivera ljud för bättre inlärning',
            textAr: 'فعّل الصوت لتعلم أفضل',
            actionSv: 'Aktivera',
            actionAr: 'تفعيل',
            action: () => updateSettings('soundEffects', true)
        });
    }

    if (!settings.reminderEnabled) {
        recommendations.push({
            id: 'reminder',
            icon: '⏰',
            textSv: 'Sätt en daglig påminnelse',
            textAr: 'ضبط تذكير يومي',
            actionSv: 'Aktivera',
            actionAr: 'تفعيل',
            action: () => updateSettings('reminderEnabled', true)
        });
    }

    if (settings.dailyGoal < 10) {
        recommendations.push({
            id: 'goal',
            icon: '🎯',
            textSv: 'Öka ditt dagliga mål för snabbare framsteg',
            textAr: 'زيادة هدفك اليومي لتقدم أسرع',
            actionSv: 'Ändra',
            actionAr: 'تغيير',
            action: () => updateSettings('dailyGoal', 10)
        });
    }

    if (recommendations.length === 0) return null;

    return (
        <section className="settings-recommendations glass-card">
            <div className="recommendations-header">
                <span className="rec-icon">💡</span>
                <span className="rec-title">
                    <span className="sv-text">Rekommenderade inställningar</span>
                    <span className="ar-text">إعدادات موصى بها</span>
                </span>
            </div>
            <div className="recommendations-list">
                {recommendations.map(rec => (
                    <div key={rec.id} className="recommendation-item">
                        <div className="rec-item-icon">{rec.icon}</div>
                        <div className="rec-item-text">
                            <span className="sv-text">{rec.textSv}</span>
                            <span className="ar-text">{rec.textAr}</span>
                        </div>
                        <span className="rec-item-action cursor-pointer" onClick={rec.action}>
                            <span className="sv-text">{rec.actionSv}</span>
                            <span className="ar-text">{rec.actionAr}</span>
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
};
