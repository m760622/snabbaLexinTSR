
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

    // ... (Keep existing handlers, update onBack)
    const playAudio = () => {
        if (!currentWord) return;
        TTSManager.speak(currentWord.swe);
    };

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

            // Logic for badge would go here (omitted for brevity)

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
                    <header className="training-header flex justify-between items-center mb-6">
                        <button
                            className="training-back-btn p-2"
                            onClick={onBack}
                            aria-label="Tillbaka"
                            title="Tillbaka"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        </button>
                        <div className="training-progress text-sm">
                            {currentIndex + 1} / {words.length}
                        </div>
                    </header>

                    {/* Card */}
                    <div
                        className={`training-card relative w-full h-80 perspective-1000 cursor-pointer ${isFlipped ? 'flipped' : ''}`}
                        onClick={handleFlip}
                    >
                        <div className={`card-inner w-full h-full relative transition-transform duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
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
                                className="p-3 rounded-xl font-bold text-sm bg-surface glass-effect active:scale-95 transition-transform"
                                style={{ borderBottomColor: btn.color }}
                            >
                                {btn.label.split(' / ')[0]}
                            </button>
                        ))}
                    </div>

                </div>
            ) : (
                <div className="text-center p-10">
                    <h2 className="text-2xl font-bold mb-4">Träning Klar! 🎉</h2>
                    <p className="mb-6">Du har repeterat alla ord.</p>
                    <button onClick={onBack} className="primary-btn">Tillbaka</button>
                    {hasTrainingWords && <button onClick={handleRestart} className="btn-secondary ml-2">Igen</button>}
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
