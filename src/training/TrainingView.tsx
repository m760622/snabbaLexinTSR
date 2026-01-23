/**
 * Smart Training View
 * Flashcard Interface with SM-2 Spaced Repetition
 * Neon/Glow Design Edition 🎨
 */
import React, { useState, useEffect, useRef } from 'react';
import { DictionaryDB, DataLoader } from '../db';
import { TTSManager } from '../tts';
import { calculateNextReview, Quality, QUALITY_BUTTONS, DEFAULT_REVIEW_DATA } from './spaced-repetition';

interface Word {
    id: string;
    swe: string;
    arb: string;
    type?: string;
    sweDef?: string;
    sweEx?: string;
    arbEx?: string;
}

interface SessionStats {
    wordsReviewed: number;
    correctCount: number;
    startTime: number;
}

const TrainingView: React.FC = () => {
    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showGlass, setShowGlass] = useState(false);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

    // Session stats
    const [stats, setStats] = useState<SessionStats>({
        wordsReviewed: 0,
        correctCount: 0,
        startTime: Date.now()
    });

    // Touch handling for swipe
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadTrainingWords();
        setTimeout(() => setShowGlass(true), 100);
    }, []);

    const loadTrainingWords = async () => {
        setIsLoading(true);
        try {
            if (!(await DictionaryDB.hasCachedData())) {
                await DataLoader.loadDictionary();
            }

            // Use SM-2 filtered words (due for review)
            const trainingWords = await DictionaryDB.getTrainingWordsDue();

            const mapWord = (w: any): Word => {
                if (Array.isArray(w)) {
                    return {
                        id: w[0],
                        swe: w[2],
                        arb: w[3],
                        type: w[1],
                        sweDef: w[5],
                        sweEx: w[7],
                        arbEx: w[8]
                    };
                }
                return {
                    id: w.id,
                    swe: w.swe || w.swedish,
                    arb: w.arb || w.arabic,
                    type: w.type,
                    sweDef: w.sweDef,
                    sweEx: w.sweEx,
                    arbEx: w.arbEx
                };
            };

            let mappedWords: Word[] = trainingWords.map(mapWord);

            // Data integrity check
            const hasCorruptData = mappedWords.some(w => !w.swe || !w.arb);
            if (hasCorruptData) {
                await DataLoader.refreshCache();
                const retryWords = await DictionaryDB.getTrainingWordsDue();
                mappedWords = retryWords.map(mapWord);
            }

            const validWords = mappedWords.filter(w => w.swe && w.arb);
            setWords(validWords);
        } catch (error) {
            console.error('Failed to load training words', error);
        } finally {
            setIsLoading(false);
        }
    };

    const currentWord = words[currentIndex];

    const playAudio = () => {
        if (!currentWord) return;
        TTSManager.speak(currentWord.swe);
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
        playAudio();
    };

    // SM-2 Rating Handler
    const handleRating = async (quality: Quality) => {
        if (!currentWord) return;

        // Get current review data
        const existingData = await DictionaryDB.getReviewData(currentWord.id);
        const currentData = existingData || DEFAULT_REVIEW_DATA;

        // Calculate next review
        const { newData, wasCorrect } = calculateNextReview(quality, currentData);

        // Save to DB
        // If Quality is Easy (5), mark as mastered (remove from training)
        if (quality === Quality.Easy) {
            await DictionaryDB.updateTrainingStatus(currentWord.id, false);
        } else {
            await DictionaryDB.updateReviewData(currentWord.id, newData);
        }

        // Update stats
        setStats(prev => ({
            ...prev,
            wordsReviewed: prev.wordsReviewed + 1,
            correctCount: prev.correctCount + (wasCorrect ? 1 : 0)
        }));

        // Animate card out
        setSwipeDirection(wasCorrect ? 'right' : 'left');

        // Haptic feedback
        if ('vibrate' in navigator) {
            navigator.vibrate(wasCorrect ? 50 : [50, 30, 50]);
        }

        // Move to next card after animation
        setTimeout(() => {
            setSwipeDirection(null);
            setIsFlipped(false);

            if (quality === Quality.Again) {
                // Move to end of queue for "Again"
                setWords(prev => {
                    const updated = [...prev];
                    const [removed] = updated.splice(currentIndex, 1);
                    updated.push(removed);
                    return updated;
                });
            } else {
                // Remove from current session (will come back based on nextReview)
                const newWords = words.filter(w => w.id !== currentWord.id);
                setWords(newWords);
                if (currentIndex >= newWords.length) {
                    setCurrentIndex(Math.max(0, newWords.length - 1));
                }
            }
        }, 300);
    };

    // Touch handlers for swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
        if (cardRef.current && isFlipped) {
            const diff = touchEndX.current - touchStartX.current;
            cardRef.current.style.transform = `translateX(${diff * 0.3}px) rotateY(180deg)`;
        }
    };

    const handleTouchEnd = () => {
        if (!isFlipped) return;

        const diff = touchEndX.current - touchStartX.current;
        const threshold = 80;

        if (cardRef.current) {
            cardRef.current.style.transform = '';
        }

        if (diff > threshold) {
            handleRating(Quality.Good); // Swipe right = Good
        } else if (diff < -threshold) {
            handleRating(Quality.Again); // Swipe left = Again
        }
    };

    // Save session on unmount
    useEffect(() => {
        return () => {
            if (stats.wordsReviewed > 0) {
                DictionaryDB.saveTrainingSession({
                    date: new Date().toISOString().split('T')[0],
                    wordsReviewed: stats.wordsReviewed,
                    correctCount: stats.correctCount,
                    timeSpentMs: Date.now() - stats.startTime
                });
            }
        };
    }, [stats]);

    if (isLoading) {
        return (
            <div className="training-loading">
                <div className="loading-spinner"></div>
                <p className="text-loading">Laddar...</p>
            </div>
        );
    }

    if (words.length === 0) {
        return <MissionAccomplished stats={stats} />;
    }

    return (
        <div className={`training-container transition-opacity duration-700 ${showGlass ? 'opacity-100' : 'opacity-0'}`}>

            {/* Header / Progress */}
            <div className="training-header">
                <button
                    className="training-back-btn"
                    onClick={() => window.location.href = '/'}
                    aria-label="Tillbaka / رجوع"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>

                <div className="training-counter">
                    <span>Kvar:</span>
                    <span className="counter-label">{words.length}</span>
                </div>
                <div className="training-counter mastered-counter">
                    <span>📊</span>
                    <span className="counter-label mastered-val">
                        {stats.wordsReviewed > 0
                            ? `${Math.round((stats.correctCount / stats.wordsReviewed) * 100)}%`
                            : '0%'}
                    </span>
                </div>
            </div>

            {/* Flashcard Component */}
            <div
                className={`training-card ${isFlipped ? 'flipped' : ''} ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}
                onClick={handleFlip}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div className="card-inner" ref={cardRef}>
                    {/* Front Face: Swedish */}
                    <div className="card-face card-front">
                        {currentWord.type && (
                            <div className="card-type">{currentWord.type}</div>
                        )}
                        <h2 className="card-word">{currentWord.swe}</h2>
                    </div>

                    {/* Back Face: Arabic & Details */}
                    <div className="card-face card-back">
                        <h2 className="card-arabic" dir="rtl">{currentWord.arb}</h2>
                        <div className="divider"></div>
                        <div className="card-section">
                            {currentWord.sweDef && (
                                <div className="card-definition">{currentWord.sweDef}</div>
                            )}
                            {currentWord.sweEx && (
                                <div className="card-example-container">
                                    <p className="card-example-swe">"{currentWord.sweEx}"</p>
                                    {currentWord.arbEx && <p className="card-example" dir="rtl">{currentWord.arbEx}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Swipe Hint (Always Outside Card) */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '1rem',
                marginBottom: '1.5rem',
                width: '100%',
                whiteSpace: 'nowrap',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                padding: '0 1rem'
            }}>
                👆 Tryck för att vända • اضغط للقلب
            </div>

            {/* SM-2 Rating Buttons */}
            <div className="training-controls sm2-controls">
                {QUALITY_BUTTONS.map((btn) => (
                    <button
                        key={btn.quality}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRating(btn.quality);
                        }}
                        className={`training-btn sm2-btn quality-${btn.quality}`}
                        style={{ '--btn-color': btn.color } as React.CSSProperties}
                    >
                        <span className="btn-icon">{btn.icon}</span>
                        <span className="btn-label">{btn.label.split(' / ')[0]}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

// Subcomponent: Empty State
const MissionAccomplished: React.FC<{ stats: SessionStats }> = ({ stats }) => {
    const accuracy = stats.wordsReviewed > 0
        ? Math.round((stats.correctCount / stats.wordsReviewed) * 100)
        : 0;
    const timeSpent = Math.round((Date.now() - stats.startTime) / 60000);

    return (
        <div className="training-state complete">
            <div className="state-emoji">🎉</div>
            <h2 className="text-white">Träning Klar!</h2>
            <p>Grymt jobbat! Du har repeterat alla ord som behövdes idag.</p>

            <div className="stats-grid">
                <div className="stat-item">
                    <span className="stat-value">{stats.wordsReviewed}</span>
                    <span className="stat-label">Ord repeterade</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{accuracy}%</span>
                    <span className="stat-label">Precision</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{timeSpent}m</span>
                    <span className="stat-label">Tid</span>
                </div>
            </div>

            <div className="complete-actions">
                <a href="/" className="training-btn primary">
                    Tillbaka Hem
                </a>
            </div>
        </div>
    );
};

export default TrainingView;
