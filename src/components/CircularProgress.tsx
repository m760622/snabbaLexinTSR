import React from 'react';

interface CircularProgressProps {
    progress: number; // 0-100
    size?: number;
    strokeWidth?: number;
    color?: string;
    bgColor?: string;
    children?: React.ReactNode;
}

/**
 * Circular Progress Component
 * Animated SVG ring showing XP progress to next level
 */
const CircularProgress: React.FC<CircularProgressProps> = ({
    progress,
    size = 120,
    strokeWidth = 8,
    color = 'var(--aurora-1, #2dd4bf)',
    bgColor = 'rgba(255, 255, 255, 0.1)',
    children
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="circular-progress" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                {/* Background circle */}
                <circle
                    className="circular-progress-bg"
                    stroke={bgColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress circle */}
                <circle
                    className="circular-progress-bar"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                        transition: 'stroke-dashoffset 0.5s ease-out'
                    }}
                />
            </svg>
            {/* Content in center */}
            <div className="circular-progress-content">
                {children}
            </div>
        </div>
    );
};

export default CircularProgress;
