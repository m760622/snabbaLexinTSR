
import React, { useRef, useEffect } from 'react';

export type ViewMode = 'browse' | 'quiz' | 'flashcard' | 'lesson' | 'saved' | 'dna';

interface MobileDockProps {
    activeMode: ViewMode;
    onModeChange: (mode: ViewMode) => void;
}

export const MobileDock: React.FC<MobileDockProps> = ({ activeMode, onModeChange }) => {
    const indicatorRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Update indicator position when activeMode changes
    useEffect(() => {
        if (!indicatorRef.current || !containerRef.current) return;

        const activeBtn = containerRef.current.querySelector(`[data-mode="${activeMode}"]`) as HTMLElement;
        if (!activeBtn) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();
        const offsetLeft = btnRect.left - containerRect.left;

        indicatorRef.current.style.width = `${btnRect.width}px`;
        indicatorRef.current.style.transform = `translateX(${offsetLeft - 6}px)`; // -6px for padding offset adjusted
    }, [activeMode]);

    const handleModeClick = (mode: ViewMode) => {
        if (mode === 'dna') {
            window.location.href = '../word-dna.html';
        } else {
            onModeChange(mode);
        }
    };

    return (
        <div id="modeSelectionBar" className="floating-dock" ref={containerRef}>
            <span className="mode-indicator" id="modeIndicator" ref={indicatorRef}></span>

            <button
                type="button"
                className={`mode-btn ${activeMode === 'browse' ? 'active' : ''}`}
                data-mode="browse"
                onClick={() => handleModeClick('browse')}
                title="Bläddra / تصفح"
            >
                <span className="mode-icon">🔍</span>
                <span className="dock-label">Bläddra</span>
            </button>

            <button
                type="button"
                className={`mode-btn ${activeMode === 'quiz' ? 'active' : ''}`}
                data-mode="quiz"
                onClick={() => handleModeClick('quiz')}
                title="Quiz / اختبار"
            >
                <span className="mode-icon">❓</span>
                <span className="dock-label">Quiz</span>
            </button>

            <button
                type="button"
                className={`mode-btn ${activeMode === 'flashcard' ? 'active' : ''}`}
                data-mode="flashcard"
                onClick={() => handleModeClick('flashcard')}
                title="Flashcards / بطاقات"
            >
                <span className="mode-icon">🃏</span>
                <span className="dock-label">Blixtkort</span>
            </button>

            <button
                type="button"
                className={`mode-btn ${activeMode === 'saved' ? 'active' : ''}`}
                data-mode="saved"
                onClick={() => handleModeClick('saved')}
                title="Sparade / المحفوظة"
            >
                <span className="mode-icon">⭐</span>
                <span className="dock-label">Sparade</span>
            </button>

            <button
                type="button"
                className="mode-btn"
                data-mode="dna"
                onClick={() => handleModeClick('dna')}
                title="Ordets DNA / الـ DNA للكلمة"
            >
                <span className="mode-icon">🧬</span>
                <span className="dock-label">DNA</span>
            </button>
        </div>
    );
};
