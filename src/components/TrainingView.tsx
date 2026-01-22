/**
 * TrainingView - React Training System Main Component
 * Flashcard-based learning with flip animation and mastery tracking
 */
import React, { useState, useCallback } from 'react';
import { useTrainingWords } from '../hooks/useTrainingWords';

const TrainingView: React.FC = () => {
    const {
        isLoading,
        error,
        currentWord,
        remainingCount,
        masteredCount,
        markAsMastered,
        nextWord,
        prevWord
    } = useTrainingWords();

    const [isFlipped, setIsFlipped] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Handle card flip
    const handleFlip = useCallback(() => {
        if (isAnimating) return;
        setIsFlipped(prev => !prev);
    }, [isAnimating]);

    // Handle mastered action
    const handleMastered = useCallback(async () => {
        if (!currentWord || isAnimating) return;

        setIsAnimating(true);

        // Fly out animation
        const card = document.querySelector('.training-card') as HTMLElement;
        if (card) {
            card.classList.add('fly-out');
        }

        await new Promise(resolve => setTimeout(resolve, 400));
        await markAsMastered(currentWord.id);
        setIsFlipped(false);

        if (card) {
            card.classList.remove('fly-out');
        }

        setIsAnimating(false);
    }, [currentWord, markAsMastered, isAnimating]);

    // Handle skip (next word)
    const handleSkip = useCallback(() => {
        if (isAnimating) return;
        setIsFlipped(false);
        nextWord();
    }, [nextWord, isAnimating]);

    // Loading state
    if (isLoading) {
        return (
            <div className="training-state">
                <div className="loading-spinner"></div>
                <p className="sv-text">Laddar träningsord...</p>
                <p className="ar-text">جاري تحميل كلمات التدريب...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="training-state error">
                <span className="state-emoji">⚠️</span>
                <p>{error}</p>
                <a href="index.html" className="back-link">
                    <span className="sv-text">Tillbaka</span>
                    <span className="ar-text">رجوع</span>
                </a>
            </div>
        );
    }

    // Empty state - all done!
    if (!currentWord) {
        return (
            <div className="training-state complete">
                <span className="state-emoji">🎉</span>
                <h2>
                    <span className="sv-text">Bra jobbat!</span>
                    <span className="ar-text">أحسنت!</span>
                </h2>
                <p>
                    <span className="sv-text">
                        Du har gått igenom alla dina träningsord.
                        {masteredCount > 0 && ` Du har lärt dig ${masteredCount} ord!`}
                    </span>
                    <span className="ar-text">
                        لقد أنهيت جميع كلمات التدريب.
                        {masteredCount > 0 && ` لقد تعلمت ${masteredCount} كلمة!`}
                    </span>
                </p>
                <div className="complete-actions">
                    <a href="index.html" className="training-btn primary">
                        <span className="sv-text">Tillbaka till sökning</span>
                        <span className="ar-text">العودة للبحث</span>
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="training-container">
            {/* Header */}
            <header className="training-header">
                <a href="index.html" className="back-btn" aria-label="Tillbaka">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5"></path>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </a>
                <h1 className="training-title">
                    <span className="sv-text">Träning</span>
                    <span className="ar-text">التدريب</span>
                </h1>
                <div className="training-counter">
                    {remainingCount} <span className="counter-label sv-text">kvar</span><span className="counter-label ar-text">متبقي</span>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="training-progress">
                <div
                    className="progress-fill"
                    style={{ width: `${masteredCount > 0 ? (masteredCount / (masteredCount + remainingCount)) * 100 : 0}%` }}
                ></div>
                <span className="progress-text">
                    {masteredCount} / {masteredCount + remainingCount}
                </span>
            </div>

            {/* Flashcard */}
            <div
                className={`training-card ${isFlipped ? 'flipped' : ''}`}
                onClick={handleFlip}
            >
                <div className="card-inner">
                    {/* Front - Swedish */}
                    <div className="card-face card-front">
                        <span className="card-type">{currentWord.type || 'ord'}</span>
                        <h2 className="card-word">{currentWord.swedish}</h2>
                        <p className="card-hint">
                            <span className="sv-text">Tryck för att se svaret</span>
                            <span className="ar-text">اضغط لرؤية الإجابة</span>
                        </p>
                    </div>

                    {/* Back - Arabic + Definition */}
                    <div className="card-face card-back">
                        <h2 className="card-arabic">{currentWord.arabic}</h2>
                        {currentWord.arabicExt && (
                            <p className="card-arabic-ext">{currentWord.arabicExt}</p>
                        )}
                        {currentWord.definition && (
                            <p className="card-definition">{currentWord.definition}</p>
                        )}
                        {currentWord.example && (
                            <p className="card-example">"{currentWord.example}"</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="training-controls">
                <button
                    className="training-btn skip"
                    onClick={handleSkip}
                    disabled={isAnimating}
                >
                    <svg className="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 4 15 12 5 20 5 4"></polygon>
                        <line x1="19" y1="5" x2="19" y2="19"></line>
                    </svg>
                    <span className="sv-text">Hoppa över</span>
                    <span className="ar-text">تخطي</span>
                </button>

                <button
                    className="training-btn mastered"
                    onClick={handleMastered}
                    disabled={isAnimating}
                >
                    <svg className="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span className="sv-text">Klarad!</span>
                    <span className="ar-text">أتقنتها!</span>
                </button>
            </div>

            {/* Swipe Hint */}
            <p className="swipe-hint">
                <span className="sv-text">← föregående | nästa →</span>
                <span className="ar-text">→ السابق | التالي ←</span>
            </p>
        </div>
    );
};

export default TrainingView;
