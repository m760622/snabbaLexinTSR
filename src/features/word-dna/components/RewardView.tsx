import React, { useState, useEffect } from 'react';

interface RewardViewProps {
    streak: number;
    onClose: () => void;
    word: string;
}

export const RewardView: React.FC<RewardViewProps> = ({ streak, onClose, word }) => {
    const [xp, setXp] = useState(0);
    useEffect(() => {
        const timeout = setTimeout(() => {
            let count = 0;
            const interval = setInterval(() => {
                count += 1;
                setXp(count);
                if (count >= 10) clearInterval(interval);
            }, 60);
        }, 800);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="reward-overlay fade-in">
            <div className="glass-reward-card">
                <div className="reward-glow"></div>
                <h2 className="reward-title">Dagens Mål Nått! 🎯</h2>

                <div className="stats-row">
                    <div className="stat-box">
                        <div className="stat-label">Streak</div>
                        <div className="stat-value">🔥 {streak}</div>
                    </div>
                    <div className="stat-box">
                        <div className="stat-label">Reward</div>
                        <div className="stat-value xp-gain">+{xp} XP</div>
                    </div>
                </div>

                <div className="reward-message">
                    Du har lärt dig <strong>"{word}"</strong> idag. Bra jobbat!
                </div>

                <div className="reward-actions">
                    <button className="share-btn-premium"><span className="icon">📤</span> Share Story</button>
                    <button className="continue-btn" onClick={onClose}>Fortsätt</button>
                </div>
            </div>
        </div>
    );
};
