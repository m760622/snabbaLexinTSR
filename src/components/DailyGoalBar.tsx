import React from 'react';

interface DailyGoalBarProps {
    current: number;
    target: number;
    label?: string;
}

/**
 * Daily Goal Progress Bar
 * Linear progress showing daily goal completion
 */
const DailyGoalBar: React.FC<DailyGoalBarProps> = ({ current, target, label }) => {
    const percentage = Math.min((current / target) * 100, 100);
    const isComplete = current >= target;

    return (
        <div className={`daily-goal-bar ${isComplete ? 'complete' : ''}`}>
            <div className="goal-header">
                <span className="goal-label">
                    {label || (
                        <>
                            <span className="sv-text">Dagens mål</span>
                            <span className="ar-text">هدف اليوم</span>
                        </>
                    )}
                </span>
                <span className="goal-progress">
                    {current}/{target}
                    {isComplete && <span className="goal-check"> ✓</span>}
                </span>
            </div>
            <div className="goal-track">
                <div
                    className="goal-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export default DailyGoalBar;
