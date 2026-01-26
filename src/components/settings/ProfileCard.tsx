import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';

export const ProfileCard: React.FC = () => {
    const { settings, progress, updateSettings } = useSettings();
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    const xpNeeded = Math.floor(100 * Math.pow(1.5, progress.level - 1));
    const percentage = Math.min(100, (progress.xp / xpNeeded) * 100);

    const avatars = ['👤', '🧑', '👩', '👨', '🧑‍🦱', '👩‍🦰', '🧔', '👧', '👦', '🧒',
        '😊', '😎', '🤓', '🦊', '🐱', '🐶', '🦁', '🐻', '🐼', '🦉',
        '🌟', '⭐', '🔥', '💎', '🎯'];

    return (
        <section className="settings-profile-card glass-card">
            <div className="profile-avatar-wrapper">
                <div className="profile-avatar">
                    <span className="avatar-emoji">{settings.avatar}</span>
                </div>
                <button
                    type="button"
                    className="avatar-edit-btn"
                    onClick={() => setIsAvatarModalOpen(true)}
                    title="Ändra avatar"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                </button>
            </div>

            <div className="profile-info">
                <h2 className="profile-name">
                    <span className="sv-text">Gäst</span>
                    <span className="ar-text">زائر</span>
                </h2>
                <p className="profile-level">
                    <span className="level-badge">
                        <span className="sv-text">Nivå</span>
                        <span className="ar-text">المستوى</span>
                        <span>{progress.level}</span>
                    </span>
                    <span className="xp-text">{progress.xp} XP</span>
                </p>
            </div>

            <div className="profile-stats">
                <div className="profile-stat">
                    <span className="stat-value">{progress.wordsLearned}</span>
                    <span className="stat-label">
                        <span className="sv-text">Ord</span>
                        <span className="ar-text">كلمات</span>
                    </span>
                </div>
                <div className="profile-stat">
                    <span className="stat-value">{progress.streak}</span>
                    <span className="stat-label">
                        <span className="sv-text">Streak</span>
                        <span className="ar-text">سلسلة</span>
                    </span>
                </div>
                <div className="profile-stat">
                    <span className="stat-value">{progress.gamesPlayed}</span>
                    <span className="stat-label">
                        <span className="sv-text">Spel</span>
                        <span className="ar-text">ألعاب</span>
                    </span>
                </div>
            </div>

            <div className="profile-progress">
                <div className="progress-header">
                    <span>
                        <span className="sv-text">Framsteg till nivå</span>
                        <span className="ar-text">التقدم إلى مستوى</span>
                        <span> {progress.level + 1}</span>
                    </span>
                    <span>{Math.round(percentage)}%</span>
                </div>
                <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${percentage}%` }}></div>
                </div>
            </div>

            {/* Avatar Modal */}
            {isAvatarModalOpen && (
                <div className="modal-overlay" onClick={() => setIsAvatarModalOpen(false)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="sv-text">Välj Avatar</span>
                                <span className="ar-text">اختر الصورة الرمزية</span>
                            </h3>
                            <button type="button" className="close-modal-btn" onClick={() => setIsAvatarModalOpen(false)}>&times;</button>
                        </div>
                        <div className="avatar-grid">
                            {avatars.map(av => (
                                <button
                                    key={av}
                                    className={`avatar-option ${settings.avatar === av ? 'selected' : ''}`}
                                    onClick={() => {
                                        updateSettings('avatar', av);
                                        setIsAvatarModalOpen(false);
                                    }}
                                >
                                    {av}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};
