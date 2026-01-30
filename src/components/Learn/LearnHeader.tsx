
import React, { useEffect, useState } from 'react';

interface LearnHeaderProps {
    onBack?: () => void;
    onProfile?: () => void;
    hideBack?: boolean;
}

export const LearnHeader: React.FC<LearnHeaderProps> = ({ onBack, onProfile, hideBack }) => {
    const [isMobileView, setIsMobileView] = useState(false);

    useEffect(() => {
        // Init state from local storage or body class
        const stored = localStorage.getItem('learnMobileView') === 'true';
        if (stored) {
            setIsMobileView(true);
            document.body.classList.add('iphone-view');
        }
    }, []);

    const toggleMobileView = () => {
        const newState = !isMobileView;
        setIsMobileView(newState);
        document.body.classList.toggle('iphone-view', newState);
        localStorage.setItem('learnMobileView', newState.toString());
    };

    return (
        <header className="modern-header-learn">
            <div className="nav-left-group" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                {!hideBack && (
                    <button
                        type="button"
                        className="nav-btn-circle back-btn-modern"
                        onClick={onBack || (() => window.location.href = '../index.html')}
                        aria-label="Tillbaka / رجوع"
                        title="Tillbaka / رجوع"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                )}

                <button
                    type="button"
                    className={`nav-btn-circle mobile-toggle-btn ${isMobileView ? 'active' : ''}`}
                    id="mobileToggleBtn"
                    onClick={toggleMobileView}
                    title="Mobilvy / عرض الجوال"
                    aria-label="Mobilvy / عرض الجوال"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                        <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    </svg>
                </button>
            </div>

            <div className="brand-header-modern">
                <h1 className="modern-title-gradient">LÄR DIG<br />SVENSKA</h1>
            </div>

            <button
                type="button"
                className="nav-btn-circle profile-btn-modern"
                onClick={onProfile || (() => window.location.href = '../profile.html')}
                title="Profil / الملف الشخصي"
                aria-label="Profil / الملف الشخصي"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            </button>
        </header>
    );
};
