import React from 'react';

export interface Badge {
    id: string;
    name: string;
    icon: string;
    description: string;
    requirement: (stats: any) => boolean;
}

const badgeDefinitions: Badge[] = [
    { id: 'b1', name: 'المبتدئ الواعد', icon: '🌱', description: 'أتقن 5 كلمات', requirement: (s) => s.wordsMastered >= 5 },
    { id: 'b2', name: 'شعلة النشاط', icon: '🔥', description: 'سلسلة 3 أيام', requirement: (s) => s.currentStreak >= 3 },
    { id: 'b3', name: 'قاموس بشري', icon: '📚', description: 'أتقن 50 كلمة', requirement: (s) => s.wordsMastered >= 50 },
    { id: 'b4', name: 'بطل النطق', icon: '🎤', description: 'استخدم مختبر النطق', requirement: (s) => s.speechCount >= 10 },
];

export const BadgesSection: React.FC<{ stats: any }> = ({ stats }) => {
    return (
        <div className="badges-section">
            <h3 className="badges-title">
                <span className="sv-text">Utmärkelser</span>
                <span className="ar-text">أوسمة الإنجاز</span> 🏆
            </h3>
            <div className="badges-grid">
                {badgeDefinitions.map(badge => {
                    const isUnlocked = badge.requirement(stats);
                    return (
                        <div
                            key={badge.id}
                            className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                        >
                            <div className="badge-icon-wrapper">
                                <span className="badge-icon">{badge.icon}</span>
                            </div>
                            <div className="badge-name">{badge.name}</div>
                            <div className="badge-desc">{badge.description}</div>
                            {!isUnlocked && <div className="badge-locked-hint">🔒 قيد القفل</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
