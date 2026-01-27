/**
 * Smart Training View
 * Flashcard Interface with SM-2 Spaced Repetition
 * Neon/Glow Design Edition 🎨
 */
import React, { useState, useEffect, useRef } from 'react';
import { DictionaryDB, DataLoader } from '../db';
import { TTSManager } from '../tts';
import { calculateNextReview, Quality, QUALITY_BUTTONS, DEFAULT_REVIEW_DATA } from './spaced-repetition';
import { AIService } from '../services/aiService';
import { StorageSync } from '../utils/storage-sync';
import { Confetti } from '../confetti';
import StoryModal from '../components/StoryModal';

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

    // Story AI Integration
    const [masteredWordsInSession, setMasteredWordsInSession] = useState<Word[]>([]);
    const [isGeneratingStory, setIsGeneratingStory] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [generatedStory, setGeneratedStory] = useState<{
        title_sv: string;
        title_ar: string;
        sentences: { swedish_sentence: string; arabic_translation: string }[]
    } | null>(null);

    const [hasTrainingWords, setHasTrainingWords] = useState(false);
    const [totalSessionWords, setTotalSessionWords] = useState(0);

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
            if (totalSessionWords === 0) {
                setTotalSessionWords(validWords.length);
            }
        } catch (error) {
            console.error('Failed to load training words', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestart = () => {
        setStats({
            wordsReviewed: 0,
            correctCount: 0,
            startTime: Date.now()
        });
        setCurrentIndex(0);
        setIsFlipped(false);
        setSwipeDirection(null);
        loadTrainingWords();
    };

    useEffect(() => {
        const checkCount = async () => {
            if (words.length === 0) {
                const count = await DictionaryDB.getTrainingCount();
                setHasTrainingWords(count > 0);
            }
        };
        checkCount();
    }, [words.length]);

    // Automatic Story Trigger - REDUNDANT NOW, logic moved to handleRating
    // useEffect(() => {
    //     if (masteredWordsInSession.length === 3 && !isGeneratingStory) {
    //         triggerStoryGeneration();
    //     }
    // }, [masteredWordsInSession.length]);

    const currentWord = words[currentIndex];

    const playAudio = () => {
        if (!currentWord) return;
        TTSManager.speak(currentWord.swe);

        // Track usage for "Speech Champion" badge
        const currentUsage = parseInt(localStorage.getItem('ttsUsage') || '0', 10);
        localStorage.setItem('ttsUsage', (currentUsage + 1).toString());
    };

    // Touch handlers for swipe
    const touchStartY = useRef(0);
    const touchEndY = useRef(0);
    const isDragging = useRef(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        isDragging.current = false;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
        touchEndY.current = e.touches[0].clientY;

        const diffX = touchEndX.current - touchStartX.current;
        const diffY = touchEndY.current - touchStartY.current;

        // Mark as dragging if moved significantly
        if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
            isDragging.current = true;
        }

        // Determine dominant axis
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe (Rating)
            if (Math.abs(diffX) > 10 && cardRef.current) {
                // Prevent scrolling when swiping horizontally
                if (e.cancelable) e.preventDefault();

                // Add resistance/rotation
                const rotation = diffX * 0.05; // 5% rotation
                const baseRotate = isFlipped ? 180 : 0;
                cardRef.current.style.transform = `translateX(${diffX}px) rotateY(${baseRotate}deg) rotateZ(${rotation}deg)`;
            }
        } else {
            // Vertical swipe (Audio)
            if (diffY < -10 && cardRef.current) {
                const baseRotate = isFlipped ? 180 : 0;
                // Slight lift effect
                cardRef.current.style.transform = `translateY(${diffY * 0.3}px) rotateY(${baseRotate}deg)`;
            }
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        const diffX = touchEndX.current - touchStartX.current;
        const diffY = touchEndY.current - touchStartY.current;
        const threshold = 60; // Lowered from 80
        const verticalThreshold = 40; // Lowered from 50

        // If we dragged, define it as handled to prevent click
        if (isDragging.current) {
            if (e.cancelable) e.preventDefault();
        }

        if (cardRef.current) {
            // Reset style
            cardRef.current.style.transform = '';
        }

        // Detect Gestures only if dragging occurred
        if (isDragging.current) {
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal Swipe
                if (diffX > threshold) {
                    handleRating(Quality.Easy); // Right = Easy (Mastered)
                    // @ts-ignore
                    if (window.AudioManager) window.AudioManager.playClickSound();
                } else if (diffX < -threshold) {
                    handleRating(Quality.Again); // Left = Again
                    // @ts-ignore
                    if (window.AudioManager) window.AudioManager.playClickSound();
                }
            } else {
                // Vertical Swipe
                if (diffY < -verticalThreshold) {
                    // Swipe Up = Play Audio
                    playAudio();
                    if ('vibrate' in navigator) navigator.vibrate(20);
                }
            }
        }

        // Reset refs
        touchStartX.current = 0;
        touchEndX.current = 0;
        touchStartY.current = 0;
        touchEndY.current = 0;
        // Keep isDragging true briefly to block the immediate click, then reset
        setTimeout(() => {
            isDragging.current = false;
        }, 200);
    };

    const handleFlip = () => {
        if (isDragging.current) return;
        setIsFlipped(!isFlipped);
        playAudio();
    };

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

            // Update profile stats (localStorage) for "Mastered Words" badge/counter
            const assessments = JSON.parse(localStorage.getItem('wordAssessments') || '{}');
            assessments[currentWord.id] = {
                id: currentWord.id,
                level: 5, // 4+ counts as mastered in UserProfile
                timestamp: Date.now()
            };
            localStorage.setItem('wordAssessments', JSON.stringify(assessments));

            // Track mastered words for AI story generation
            // IMPORTANT: We calculate the new list immediately to trigger story generation without waiting for state update
            const newMasteredList = [...masteredWordsInSession, currentWord];
            setMasteredWordsInSession(newMasteredList);

            if (newMasteredList.length === 3) {
                triggerStoryGeneration(newMasteredList);
            }
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

        // Wait for animation then advance
        setTimeout(() => {
            setSwipeDirection(null);
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        }, 300);
    };

    // Generate AI story from mastered words
    const triggerStoryGeneration = async (wordsToUse: Word[] = masteredWordsInSession) => {
        setIsGeneratingStory(true);
        setGenerationProgress(0);

        // Fake progress animation
        const progressInterval = setInterval(() => {
            setGenerationProgress(prev => {
                if (prev >= 95) return prev;
                // Random increment between 1-3%
                return prev + Math.floor(Math.random() * 3) + 1;
            });
        }, 100);

        try {
            // Extract Swedish words from mastered words objects
            const swedishWords = wordsToUse.map(word => word.swe);
            const storyData = await AIService.generateStoryFromWords(swedishWords);

            clearInterval(progressInterval);
            setGenerationProgress(100);

            // Short delay to show 100%
            setTimeout(() => {
                setGeneratedStory(storyData);
                setShowStoryModal(true);

                // Celebrate with confetti
                Confetti.burst();
                setTimeout(() => Confetti.stop(), 3000);
                setIsGeneratingStory(false); // Hide loading only after showing modal
            }, 500);

        } catch (error) {
            console.error('فشل توليد القصة:', error);
            clearInterval(progressInterval);
            setIsGeneratingStory(false);
            // alert('حدث خطأ أثناء توليد القصة. تأكد من صحة مفتاح API.'); // Silent fail better for UX? or Toast?
        }
    };

    // Reset mastered words counter after story is closed
    const handleStoryClose = () => {
        setShowStoryModal(false);
        setMasteredWordsInSession([]);
        Confetti.stop();
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

    // Unified Render Logic

    const isSessionComplete = words.length === 0 || currentIndex >= words.length;

    return (
        <>
            {isGeneratingStory && (
                <div className="story-loading-overlay lang-both">
                    <div className="glass-card loading-card-content">
                        <div className="loading-magic-icon">
                            {/* Progress Ring */}
                            <svg className="progress-ring" width="120" height="120">
                                <circle
                                    className="progress-ring__circle-bg"
                                    stroke="rgba(255, 255, 255, 0.1)"
                                    strokeWidth="8"
                                    fill="transparent"
                                    r="52"
                                    cx="60"
                                    cy="60"
                                />
                                <circle
                                    className="progress-ring__circle"
                                    stroke="#4ade80"
                                    strokeWidth="8"
                                    fill="transparent"
                                    r="52"
                                    cx="60"
                                    cy="60"
                                    style={{
                                        strokeDasharray: '326.72', // 2 * PI * 52
                                        strokeDashoffset: (326.72 - (generationProgress / 100) * 326.72).toString()
                                    }}
                                />
                            </svg>

                            {/* Centered Icon/Text */}
                            <div className="progress-text-center">
                                <span className="progress-percent">{generationProgress}%</span>
                            </div>

                            {/* Magic Elements */}
                            <div className="magic-pulse"></div>
                        </div>

                        <div className="loading-text-container">
                            <h2 className="loading-title-ar">الذكاء الاصطناعي يكتب قصتك الآن...</h2>
                            <p className="loading-subtitle-sv">AI skriver din berättelse nu...</p>
                            <div className="loading-dots">
                                <div className="dot dot-1"></div>
                                <div className="dot dot-2"></div>
                                <div className="dot dot-3"></div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {
                !isSessionComplete ? (
                    // ... (Existing Training UI Block) ...
                    <div className={`training-container lang-both transition-opacity duration-700 ${showGlass ? 'opacity-100' : 'opacity-0'}`}>
                        {/* Unified Premium Header */}
                        <header className="training-header">
                            {/* ... */}
                            <button
                                className="training-back-btn"
                                onClick={() => window.location.href = '/'}
                                aria-label="Tillbaka / رجوع"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12"></line>
                                    <polyline points="12 19 5 12 12 5"></polyline>
                                </svg>
                            </button>

                            <div className="training-progress-container">
                                <div className="progress-stats">
                                    <span>{masteredWordsInSession.length} / {totalSessionWords}</span>
                                    <span dir="rtl">المتبقي: {totalSessionWords - masteredWordsInSession.length}</span>
                                </div>
                                <div className="progress-track">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${Math.min(100, (masteredWordsInSession.length / totalSessionWords) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="training-counter mastered-counter glass-darker">
                                <span>📊</span>
                                <span className="counter-label mastered-val">
                                    {stats.wordsReviewed > 0
                                        ? `${Math.round((stats.correctCount / stats.wordsReviewed) * 100)}%`
                                        : '0%'}
                                </span>
                            </div>
                        </header>

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

                        {/* Swipe Hint */}
                        <div className="swipe-hint-container">
                            👆 Tryck för att vända • اضغط للقلب
                        </div>

                        {/* SM-2 Rating Buttons */}
                        <div className="training-controls sm2-controls w-full grid grid-cols-4 gap-2">
                            {QUALITY_BUTTONS.map((btn) => (
                                <button
                                    key={btn.quality}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRating(btn.quality);
                                    }}
                                    className={`training-btn sm2-btn quality-${btn.quality} w-full shadow-lg shadow-blue-900/20 active:scale-95`}
                                    style={{ '--btn-color': btn.color } as React.CSSProperties}
                                >
                                    <span className="btn-icon">{btn.icon}</span>
                                    <span className="btn-label">{btn.label.split(' / ')[0]}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    (isGeneratingStory || showStoryModal) ? null : <MissionAccomplished stats={stats} hasMore={hasTrainingWords} onRestart={handleRestart} />
                )
            }

            {
                showStoryModal && generatedStory && (
                    <StoryModal
                        story={generatedStory}
                        swedishWords={masteredWordsInSession.map(w => ({
                            id: w.id,
                            swedish: w.swe,
                            arabic: w.arb
                        }))}
                        isVisible={showStoryModal}
                        onClose={handleStoryClose}
                    />
                )
            }
        </>
    );
};

// Subcomponent: Empty State
const MissionAccomplished: React.FC<{ stats: SessionStats; hasMore: boolean; onRestart: () => void }> = ({ stats, hasMore, onRestart }) => {
    // Scenario A: User entered training but had NO words due (0 reviews)
    if (stats.wordsReviewed === 0) {
        return (
            <div className="training-container">
                <div className="training-state complete">
                    <div className="state-emoji">☕️</div>
                    <h2 className="text-white">Allt är klart!</h2>
                    <p>Du har inga ord att repetera just nu. Kom tillbaka senare!</p>
                    <p className="text-sm opacity-70 mt-2">Du är helt i fas med din plan.</p>

                    <div className="complete-actions">
                        <a href="/" className="training-btn primary">
                            Tillbaka Hem
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Scenario B: User actually finished a session
    const accuracy = Math.round((stats.correctCount / stats.wordsReviewed) * 100);
    const timeSpent = Math.max(1, Math.round((Date.now() - stats.startTime) / 60000)); // Ensure at least 1m if nonzero

    return (
        <div className="training-container">
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
                    {hasMore && (
                        <button onClick={onRestart} className="training-btn" style={{ width: 'auto', flex: 'none', height: '50px', padding: '0 1.5rem' }}>
                            🔄 Träna Igen
                        </button>
                    )}
                    <a href="/" className="training-btn primary">
                        Tillbaka Hem
                    </a>
                </div>
            </div>
        </div>
    );
};

export default TrainingView;
