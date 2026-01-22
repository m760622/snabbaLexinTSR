import React from 'react';

interface StreakCounterProps {
    days: number;
    isActive?: boolean;
}

/**
 * Streak Counter Component
 * Fire emoji with glow animation based on streak days
 */
const StreakCounter: React.FC<StreakCounterProps> = ({ days, isActive = true }) => {
    // Calculate fire intensity based on streak
    const getFireIntensity = () => {
        if (days === 0) return 'inactive';
        if (days < 3) return 'low';
        if (days < 7) return 'medium';
        if (days < 30) return 'high';
        return 'legendary';
    };

    const intensity = getFireIntensity();

    return (
        <div className={`streak-counter streak-${intensity} ${isActive ? 'active' : ''}`}>
            <div className="streak-fire">
                <span className="fire-emoji">🔥</span>
                {days >= 7 && <span className="fire-extra">✨</span>}
            </div>
            <div className="streak-info">
                <span className="streak-value">{days}</span>
                <span className="streak-label">
                    <span className="sv-text">dagar</span>
                    <span className="ar-text">أيام</span>
                </span>
            </div>
        </div>
    );
};

export default StreakCounter;
