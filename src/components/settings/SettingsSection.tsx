import React, { useState } from 'react';

interface SettingsSectionProps {
    id: string;
    titleSv: string;
    titleAr: string;
    icon: string;
    iconGradient: string; // e.g. "gradient-blue"
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
    id,
    titleSv,
    titleAr,
    icon,
    iconGradient,
    children,
    defaultExpanded = false
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const toggleSection = () => setIsExpanded(!isExpanded);

    return (
        <section
            className={`settings-section glass-card ${isExpanded ? 'expanded' : ''}`}
            data-section={id}
        >
            <div className="section-header" onClick={toggleSection}>
                <div className={`section-icon ${iconGradient}`}>{icon}</div>
                <div className="section-title-wrapper">
                    <h3 className="section-title">
                        <span className="sv-text">{titleSv}</span>
                        <span className="ar-text">{titleAr}</span>
                    </h3>
                </div>
                <svg className="section-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
            <div className="section-content" id={`${id}-content`}>
                {children}
            </div>
        </section>
    );
};
