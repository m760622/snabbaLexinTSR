/**
 * Smart Training View
 * Flashcard Interface for Mastering Words
 * Neon/Glow Design Edition 🎨
 */
import React, { useState, useEffect } from 'react';
import { DictionaryDB, DataLoader } from '../db';
import { TTSManager } from '../tts';
import { StorageSync } from '../utils/storage-sync';

interface Word {
    id: string;
    swe: string;
    arb: string;
    type?: string;
    sweDef?: string; // Definition
    sweEx?: string;
    arbEx?: string;
}

const TrainingView: React.FC = () => {
    const [words, setWords] = useState<Word[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [masteredCount, setMasteredCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showGlass, setShowGlass] = useState(false); // Animation trigger since mount

    useEffect(() => {
        loadTrainingWords();
        // Trigger entrance animation
        setTimeout(() => setShowGlass(true), 100);
    }, []);

    const loadTrainingWords = async () => {
        setIsLoading(true);
        try {
            // Ensure dictionary is loaded first (non-blocking mount)
            if (!(await DictionaryDB.hasCachedData())) {
                console.log('[TrainingView] Loading dictionary data...');
                await DataLoader.loadDictionary();
            }

            const trainingWords = await DictionaryDB.getTrainingWords();

            console.log('[TrainingView] Raw words from DB:', trainingWords.slice(0, 3));

            // Map raw array data (from DB) to Word objects
            // Config: ID=0, TYPE=1, SWEDISH=2, ARABIC=3, DEF=5, FORMS=6, SWE_EX=7, ARB_EX=8
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

            // DATA INTEGRITY CHECK: If words are missing content (phantom IDs), refresh cache
            const hasCorruptData = mappedWords.some(w => !w.swe || !w.arb);

            if (hasCorruptData) {
                console.warn('[TrainingView] Found incomplete words, triggering cache repair...');
                setIsLoading(true);

                await DataLoader.refreshCache();

                // Retry fetch
                const retryWords = await DictionaryDB.getTrainingWords();
                console.log('[TrainingView] Retried words from DB:', retryWords.slice(0, 3));
                mappedWords = retryWords.map(mapWord);
            }

            console.log('[TrainingView] Final mapped words:', mappedWords.slice(0, 3));

            // Filter out any remaining broken words to prevent UI glitches
            const validWords = mappedWords.filter(w => w.swe && w.arb);
            setWords(validWords);
        } catch (error) {
            console.error('Failed to load training words', error);
        } finally {
            setIsLoading(false);
        }
    };

    const currentWord = words[currentIndex];

    // Audio Playback
    const playAudio = () => {
        if (!currentWord) return;
        TTSManager.speak(currentWord.swe); // Default to Swedish
    };

    // Flip Logic
    const handleFlip = () => {
        const newFlipState = !isFlipped;
        setIsFlipped(newFlipState);

        // Play audio on every flip interaction
        playAudio();
    };

    // Master Logic
    const handleMaster = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent flip
        if (!currentWord) return;

        // Animate out (optimistic UI)
        const wordId = currentWord.id;

        // Remove from DB
        await DictionaryDB.updateTrainingStatus(wordId, false);

        // Update State
        const newWords = words.filter(w => w.id !== wordId);
        setWords(newWords);
        setMasteredCount(prev => prev + 1);
        setIsFlipped(false);

        if (currentIndex >= newWords.length) {
            setCurrentIndex(Math.max(0, newWords.length - 1));
        }
    };

    // Skip Logic
    const handleSkip = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (words.length <= 1) return; // Can't skip if only 1

        setIsFlipped(false);
        setCurrentIndex((prev) => (prev + 1) % words.length);
    };

    if (isLoading) {
        return (
            <div className="training-loading">
                <div className="loading-spinner"></div>
                <p className="text-loading">Laddar...</p>
            </div>
        );
    }

    if (words.length === 0) {
        return <MissionAccomplished mastered={masteredCount} />;
    }

    return (
        <div className={`training-container transition-opacity duration-700 ${showGlass ? 'opacity-100' : 'opacity-0'}`}>

            {/* Header / Progress */}
            <div className="training-header">
                <button
                    className="training-back-btn"
                    onClick={() => {
                        try {
                            // Try multiple navigation methods
                            if ((window as any).ViewManager) {
                                (window as any).ViewManager.show('home');
                            } else {
                                window.location.href = '/';
                            }
                        } catch (e) {
                            window.location.href = '/';
                        }
                    }}
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
                    <span>Mästrade:</span>
                    <span className="counter-label mastered-val">{masteredCount} 🏆</span>
                </div>
            </div>

            {/* Flashcard Component */}
            <div
                className={`training-card ${isFlipped ? 'flipped' : ''}`}
                onClick={handleFlip}
            >
                <div className="card-inner">

                    {/* Front Face: Swedish */}
                    <div className="card-face card-front">
                        {currentWord.type && (
                            <div className="card-type">{currentWord.type}</div>
                        )}
                        <h2 className="card-word">{currentWord.swe}</h2>
                        <div className="swipe-hint">
                            <span>👆 Tryck för att vända</span>
                            <span className="swipe-hint-dot">•</span>
                            <span dir="rtl">اضغط للقلب</span>
                        </div>
                    </div>

                    {/* Back Face: Arabic & Details */}
                    <div className="card-face card-back">
                        <h2 className="card-arabic" dir="rtl">{currentWord.arb}</h2>

                        <div className="divider"></div>

                        <div className="card-section">
                            {/* Definition */}
                            {currentWord.sweDef && (
                                <div className="card-definition">
                                    {currentWord.sweDef}
                                </div>
                            )}

                            {/* Example */}
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

            {/* Controls */}
            <div className="training-controls">
                <button
                    onClick={handleSkip}
                    className="training-btn skip"
                    aria-label="Vet ej / لا أعرف"
                >
                    <span className="btn-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </span>
                    <span>Vet ej / لا أعرف</span>
                </button>

                <button
                    onClick={handleMaster}
                    className="training-btn mastered"
                    aria-label="Kan den! / أعرفها"
                >
                    <span className="btn-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </span>
                    <span>Kan den! / أعرفها</span>
                </button>
            </div>
        </div>
    );
};

// Subcomponent: Empty State
const MissionAccomplished: React.FC<{ mastered: number }> = ({ mastered }) => (
    <div className="training-state complete">
        <div className="state-emoji">🎉</div>
        <h2 className="text-white">Träning Klar!</h2>
        <p>
            Grymt jobbat! Du har tränat klart alla ord i din lista.
        </p>
        <div className="training-counter" style={{ marginTop: '1rem', fontSize: '1.2rem', padding: '1rem 2rem' }}>
            <span>XP Intjänad:</span>
            <strong className="text-white ml-2">+{mastered * 10} XP</strong>
        </div>
        <div className="complete-actions">
            <a href="/" className="training-btn primary">
                Tillbaka Hem
            </a>
        </div>
    </div>
);

export default TrainingView;
