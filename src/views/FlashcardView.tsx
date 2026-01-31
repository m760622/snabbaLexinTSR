
/**
 * FlashcardView (Adapted from TrainingView)
 * Flashcard Interface with SM-2 Spaced Repetition
 */
import React, { useState, useEffect, useRef } from 'react';
import { DictionaryDB, DataLoader } from '../db';
import { TTSManager } from '../tts';
import { calculateNextReview, Quality, QUALITY_BUTTONS, DEFAULT_REVIEW_DATA } from '../training/spaced-repetition';
import { AIService } from '../services/aiService';
import { Confetti } from '../confetti';
import StoryModal from '../components/StoryModal';

interface FlashcardViewProps {
    onBack: () => void;
}

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

export const FlashcardView: React.FC<FlashcardViewProps> = ({ onBack }) => {
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

    // Touch handling
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
        const threshold = 60;
        const verticalThreshold = 40;

        if (isDragging.current && e.cancelable) {
            e.preventDefault();
        }

        if (cardRef.current) {
            cardRef.current.style.transform = '';
        }

        // Detect Gestures only if dragging occurred
        if (isDragging.current) {
            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal Swipe
                if (diffX > threshold) {
                    handleRating(Quality.Easy); // Right = Easy
                } else if (diffX < -threshold) {
                    handleRating(Quality.Again); // Left = Again
                }
            } else {
                // Vertical Swipe
                if (diffY < -verticalThreshold) {
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
        setTimeout(() => { isDragging.current = false; }, 200);
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
    const handleFlip = () => {
        setIsFlipped(!isFlipped);
        playAudio();
    };

    const handleRating = async (quality: Quality) => {
        if (!currentWord) return;

        const existingData = await DictionaryDB.getReviewData(currentWord.id);
        const currentData = existingData || DEFAULT_REVIEW_DATA;

        const { newData, wasCorrect } = calculateNextReview(quality, currentData);

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

            const newMasteredList = [...masteredWordsInSession, currentWord];
            setMasteredWordsInSession(newMasteredList);

            if (newMasteredList.length === 3) {
                triggerStoryGeneration(newMasteredList);
            }
        } else {
            await DictionaryDB.updateReviewData(currentWord.id, newData);
        }

        setStats(prev => ({
            ...prev,
            wordsReviewed: prev.wordsReviewed + 1,
            correctCount: prev.correctCount + (wasCorrect ? 1 : 0)
        }));

        setSwipeDirection(wasCorrect ? 'right' : 'left');

        setTimeout(() => {
            setSwipeDirection(null);
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        }, 300);
    };

    const triggerStoryGeneration = async (wordsToUse: Word[]) => {
        setIsGeneratingStory(true);
        setGenerationProgress(0);

        const progressInterval = setInterval(() => {
            setGenerationProgress(prev => prev >= 95 ? prev : prev + Math.floor(Math.random() * 3) + 1);
        }, 100);

        try {
            const swedishWords = wordsToUse.map(word => word.swe);
            const storyData = await AIService.generateStoryFromWords(swedishWords);

            clearInterval(progressInterval);
            setGenerationProgress(100);

            setTimeout(() => {
                setGeneratedStory(storyData);
                setShowStoryModal(true);
                Confetti.burst();
                setIsGeneratingStory(false);
            }, 500);

        } catch (error) {
            console.error('Failed story generation:', error);
            clearInterval(progressInterval);
            setIsGeneratingStory(false);
        }
    };

    const handleStoryClose = () => {
        setShowStoryModal(false);
        setMasteredWordsInSession([]);
        Confetti.stop();
    };

    if (isLoading) return <div className="text-center p-10">Laddar träning...</div>;

    const isSessionComplete = words.length === 0 || currentIndex >= words.length;

    return (
        <div id="flashcardView" className="view-section active fade-in w-full h-full">
            {/* Story Loading Overlay */}
            {isGeneratingStory && (
                <div className="story-loading-overlay lang-both fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
                    <div className="text-center text-white">
                        <h2 className="text-xl mb-2">AI Skriver Story...</h2>
                        <div className="mt-4 text-3xl font-bold text-accent">{generationProgress}%</div>
                    </div>
                </div>
            )}

            {!isSessionComplete ? (
                <div className={`training-container lang-both transition-opacity duration-700 ${showGlass ? 'opacity-100' : 'opacity-0'}`}>
                    <header className="training-header">
                        <button
                            className="training-back-btn"
                            onClick={onBack}
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

                    {/* Card */}
                    <div
                        className={`training-card relative w-full h-80 perspective-1000 cursor-pointer ${isFlipped ? 'flipped' : ''}`}
                        onClick={handleFlip}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className={`card-inner w-full h-full relative transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`} ref={cardRef}>
                            {/* Front */}
                            <div className="card-face card-front absolute inset-0 backface-hidden bg-surface glass-card flex flex-col items-center justify-center rounded-2xl border border-white/10">
                                <h2 className="text-3xl font-bold">{currentWord.swe}</h2>
                                {currentWord.type && <span className="text-sm text-gray-400 mt-2">{currentWord.type}</span>}
                            </div>
                            {/* Back */}
                            <div className="card-face card-back absolute inset-0 backface-hidden bg-surface glass-card flex flex-col items-center justify-center rounded-2xl border border-white/10 rotate-y-180">
                                <h2 className="text-3xl font-bold text-accent" dir="rtl" lang="ar">{currentWord.arb}</h2>
                                <div className="mt-4 text-center px-4">
                                    {currentWord.sweEx && <p className="text-sm italic">"{currentWord.sweEx}"</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-4 text-gray-400 text-sm">Tryck för att vända</div>

                    {/* Controls */}
                    <div className="grid grid-cols-4 gap-3 mt-8">
                        {QUALITY_BUTTONS.map((btn) => (
                            <button
                                key={btn.quality}
                                onClick={(e) => { e.stopPropagation(); handleRating(btn.quality); }}
                                className={`p-3 rounded-xl font-bold text-sm bg-surface glass-effect active:scale-95 transition-transform quality-btn quality-${btn.quality}`}
                                style={{ borderBottomColor: btn.color }}
                            >
                                {btn.label.split(' / ')[0]}
                            </button>
                        ))}
                    </div>

                </div>
            ) : (
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
                                <span className="stat-value">{Math.round((stats.correctCount / Math.max(1, stats.wordsReviewed)) * 100)}%</span>
                                <span className="stat-label">Precision</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{Math.max(1, Math.round((Date.now() - stats.startTime) / 60000))}m</span>
                                <span className="stat-label">Tid</span>
                            </div>
                        </div>

                        <div className="complete-actions">
                            {hasTrainingWords && (
                                <button onClick={handleRestart} className="btn-secondary h-[50px] px-6">
                                    🔄 Träna Igen
                                </button>
                            )}
                            <button onClick={onBack} className="primary-btn h-[50px] px-8">
                                Tillbaka Hem
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showStoryModal && generatedStory && (
                <StoryModal
                    story={generatedStory}
                    swedishWords={masteredWordsInSession.map(w => ({ id: w.id, swedish: w.swe, arabic: w.arb }))}
                    isVisible={showStoryModal}
                    onClose={handleStoryClose}
                />
            )}
        </div>
    );
};
