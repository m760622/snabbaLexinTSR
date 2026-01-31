import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { DNALogic } from './dnaLogic';
import { TTSManager } from '../../tts';
import { Confetti } from '../../confetti';

// Modular Components
import { SemanticMap } from './components/SemanticMap';
import { MorphologyLab } from './components/MorphologyLab';
import { EtymologyDNA } from './components/EtymologyDNA';
import { AudioVisualizer } from './components/AudioVisualizer';
import { RewardView } from './components/RewardView';
import { QuizOptions } from './components/QuizOptions';

import './word-dna.css';

const SEGMENT_DURATION = 6000;

export const WordDNA: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [word, setWord] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'word' | 'related' | 'forms' | 'example' | 'history' | 'quiz'>('word');
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordFeedback, setRecordFeedback] = useState<string | null>(null);
    const [quizState, setQuizState] = useState<'unanswered' | 'correct' | 'wrong'>('unanswered');
    const [quizError, setQuizError] = useState<string | null>(null);
    const [isLiked, setIsLiked] = useState(false);
    const [showRewards, setShowRewards] = useState(false);
    const [streak, setStreak] = useState(0);

    const lastTimeRef = useRef<number>(Date.now());
    const rafRef = useRef<number | null>(null);

    const backgroundUrl = '/Users/mohammedabunada/.gemini/antigravity/brain/e9a02675-4ebd-4e68-8992-566b2e6d763e/misty_forest_background_1769253249113.png';

    const handleFinish = useCallback(() => {
        setShowRewards(true);
        DNALogic.markComplete();
    }, []);

    const handleNext = useCallback(() => {
        if (activeTab === 'word') setActiveTab('related');
        else if (activeTab === 'related') setActiveTab('forms');
        else if (activeTab === 'forms') setActiveTab('example');
        else if (activeTab === 'example') setActiveTab('history');
        else if (activeTab === 'history') setActiveTab('quiz');
        else handleFinish();
        setProgress(0);
    }, [activeTab, handleFinish]);

    useEffect(() => {
        const load = async () => {
            const w = await DNALogic.getDailyWord();
            if (w) setWord(w);
            else onClose?.();

            // Get streak for rewards
            const stats = localStorage.getItem('userStats');
            if (stats) setStreak(JSON.parse(stats).streak || 3);
            else setStreak(3);
        };
        load();
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [onClose]);

    useEffect(() => {
        if (!word || isPaused || quizState !== 'unanswered' || activeTab === 'quiz' || showRewards) {
            setProgress(0);
            return;
        }

        const loop = () => {
            const now = Date.now();
            const dt = now - lastTimeRef.current;
            lastTimeRef.current = now;

            if (!isPaused) {
                setProgress(p => {
                    const newProgress = p + (dt / SEGMENT_DURATION) * 100;
                    if (newProgress >= 100) {
                        handleNext();
                        return 0;
                    }
                    return newProgress;
                });
            }
            rafRef.current = requestAnimationFrame(loop);
        };

        lastTimeRef.current = Date.now();
        rafRef.current = requestAnimationFrame(loop);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [activeTab, isPaused, word, quizState, showRewards, handleNext]);

    const toggleRecording = () => {
        if (!isRecording) {
            setIsRecording(true);
            setRecordFeedback(null);
            if (window.navigator.vibrate) window.navigator.vibrate(40);
        } else {
            setIsRecording(false);
            setRecordFeedback('Bra uttal! • نطق ممتاز');
            if (window.navigator.vibrate) window.navigator.vibrate([30, 30]);
            setTimeout(() => setRecordFeedback(null), 3000);
        }
    };

    const handleQuizOption = (isCorrect: boolean) => {
        if (isCorrect) {
            setQuizState('correct');
            if (window.navigator.vibrate) window.navigator.vibrate(50);
            setTimeout(() => handleFinish(), 1000);
        } else {
            setQuizState('wrong');
            setQuizError('Fel! Försök igen • خطأ، حاول مرة أخرى');
            if (window.navigator.vibrate) window.navigator.vibrate([40, 40, 40]);
            setTimeout(() => {
                setQuizState('unanswered');
                setQuizError(null);
            }, 1500);
        }
    };

    if (!word) return null;

    const tabs: Array<{ id: 'word' | 'related' | 'forms' | 'example' | 'history' | 'quiz'; label: string; icon: string }> = [
        { id: 'word', label: 'Ord', icon: '📝' },
        { id: 'related', label: 'Karta', icon: '☁️' },
        { id: 'forms', label: 'Lab', icon: '🧪' },
        { id: 'example', label: 'Exempel', icon: '✍️' },
        { id: 'history', label: 'DNA', icon: '📜' },
        { id: 'quiz', label: 'Quiz', icon: '❓' }
    ];

    if (showRewards) {
        return <RewardView streak={streak} onClose={onClose || (() => { })} word={word.swe} />;
    }

    return (
        <div className="wod-overlay">
            <div className="story-bg-layer" style={{ backgroundImage: `url(${backgroundUrl})` }}></div>
            <div className="story-bg-overlay"></div>


            <header className={`story-header ${showRewards ? 'opacity-0' : 'opacity-100'}`}>
                <div className="story-progress-container">
                    {tabs.map((tab, idx) => {
                        const tabIdx = tabs.findIndex(t => t.id === activeTab);
                        let fillWidth = idx < tabIdx ? 100 : (idx === tabIdx ? progress : 0);
                        return (
                            <div key={tab.id} className="progress-bar-segment">
                                <div className="progress-bar-fill" style={{ width: `${fillWidth}%` }}></div>
                            </div>
                        );
                    })}
                </div>

                <nav className="story-tabs">
                    {tabs.map(tab => (
                        <button key={tab.id} className={`story-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => { setActiveTab(tab.id); setProgress(0); }}>
                            <span className="tab-icon">{tab.icon}</span>
                            <span className="tab-label-text">{tab.label}</span>
                        </button>
                    ))}
                    <button className="story-tab shuffle-btn" onClick={async () => {
                        setIsPaused(true);
                        const newWord = await DNALogic.getDailyWord(true);
                        setWord(newWord);
                        setActiveTab('word');
                        setProgress(0);
                        setIsPaused(false);
                    }} title="New Word">
                        <span className="tab-icon">🔄</span>
                    </button>
                </nav>
            </header>

            <main className="story-main-content">
                {activeTab === 'word' && (
                    <div className="fade-in">
                        <h1 className="premium-word-title">{word.swe || word.swedish}</h1>
                        <div className="word-phonetic">[{word.phonetic || 'tak-sam'}]</div>
                        <div className="word-translation" dir="rtl">({word.arb || word.arabic})</div>
                    </div>
                )}

                {activeTab === 'related' && <SemanticMap related={word.related} />}
                {activeTab === 'forms' && <MorphologyLab forms={word.forms} base={word.swe} />}

                {activeTab === 'example' && (
                    <div className="fade-in">
                        <div className="example-text" dangerouslySetInnerHTML={{
                            __html: (word.sweEx || `Jag lär mig ${word.swe} idag.`).replace(word.swe, `<strong>${word.swe}</strong>`)
                        }}></div>
                        <div className="word-translation mt-5 opacity-80" dir="rtl">
                            {word.arbEx || 'مثال توضيحي للكلمة.'}
                        </div>
                        {recordFeedback && (
                            <div className="record-feedback-pop">{recordFeedback}</div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && <EtymologyDNA history={word.history} />}

                {activeTab === 'quiz' && (
                    <div className="fade-in w-full max-w-[400px]">
                        <h2 className="text-[1.8rem] mb-2.5">Vad betyder det?</h2>
                        <div className="text-[var(--story-cyan)] mb-7.5 font-semibold">{word.swe}</div>
                        <QuizOptions correctAnswer={word.arb} onAnswer={handleQuizOption} state={quizState} />
                        {quizError && (
                            <div className="record-feedback-pop bg-[var(--story-rose)] mt-5">
                                {quizError}
                            </div>
                        )}
                    </div>
                )}
            </main>

            <footer className="story-bottom-shelf">
                <div className="glass-card">
                    <div className="card-handle"></div>

                    {activeTab === 'example' ? (
                        <div className="record-container">
                            <div className="record-btn-wrapper">
                                <AudioVisualizer isActive={isRecording} />
                                <button
                                    className={`record-btn ${isRecording ? 'recording' : ''}`}
                                    onClick={toggleRecording}
                                    title={isRecording ? 'Stop Recording' : 'Start Recording'}
                                >
                                    <svg className="record-icon" fill="currentColor" viewBox="0 0 24 24">
                                        {isRecording ? <rect x="6" y="6" width="12" height="12" rx="2" /> :
                                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zM17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />}
                                    </svg>
                                </button>
                            </div>
                            <span className="text-[0.9rem] opacity-80">
                                {isRecording ? 'Listening...' : 'Try Pronouncing'}
                            </span>
                        </div>
                    ) : (
                        <div className="h-[110px] flex items-center justify-center">
                            {activeTab === 'word' ? (
                                <button className="social-btn" onClick={() => TTSManager.speak(word.swe)}>
                                    <div className="big-audio-btn"><span className="text-[1.5rem]">🔊</span></div>
                                    <span>Lyssna</span>
                                </button>
                            ) : <div className="opacity-50 italic">Swipe or choose answer</div>}
                        </div>
                    )}

                    <div className="social-actions">
                        <button className="social-btn" onClick={() => window.location.href = 'profile.html'}>
                            <span className="text-[1.4rem]">👤</span><span>Profile</span>
                        </button>
                        <button className={`social-btn ${isLiked ? 'liked' : ''}`} onClick={() => {
                            setIsLiked(!isLiked);
                            if (!isLiked && window.navigator.vibrate) window.navigator.vibrate(30);
                        }}>
                            <span className={`text-[1.4rem] ${isLiked ? 'text-[var(--story-rose)]' : ''}`}>
                                {isLiked ? '❤️' : '🤍'}
                            </span>
                            <span>Like</span>
                        </button>
                        <button className="social-btn" onClick={() => {
                            if (navigator.share) {
                                navigator.share({ title: 'SnabbaLexin - WordDNA', text: `Check out this word: ${word.swe}`, url: window.location.href });
                            } else {
                                alert('Sharing not supported on this browser');
                            }
                        }}>
                            <span className="text-[1.4rem]">📤</span><span>Share</span>
                        </button>
                        <button className="social-btn" onClick={() => alert('Comments coming soon! • التعليقات قادمة قريباً')}>
                            <span className="text-[1.4rem]">💬</span><span>Comment</span>
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

