import React, { useState, useEffect } from 'react';
import './StoryModal.css';
import { TTSManager } from '../tts';
import { StoryResponse, StorySentence } from '../services/aiService';
import { LanguageManager, Language } from '../i18n';

interface Word {
    id: string;
    swedish: string;
    arabic: string;
}

interface StoryModalProps {
    story: StoryResponse;
    swedishWords: Word[];
    onClose: () => void;
    isVisible: boolean;
}

// Extracted Component to handle individual sentence logic and karaoke
const StorySentenceView: React.FC<{
    sentence: StorySentence,
    idx: number,
    isPlaying: boolean,
    playAudio: Function,
    swedishWords: Word[]
}> = ({ sentence, idx, isPlaying, playAudio, swedishWords }) => {
    // State to track karaoke highlighting
    const [activeCharIndex, setActiveCharIndex] = useState(-1);

    useEffect(() => {
        if (!isPlaying) {
            setActiveCharIndex(-1);
            return;
        }

        const handleBoundary = (e: any) => {
            const { charIndex, text } = e.detail;
            // Only update if the text matches the current sentence
            if (text === sentence.swedish_sentence) {
                setActiveCharIndex(charIndex);
            }
        };

        const handleEnd = () => setActiveCharIndex(-1);

        window.addEventListener('tts-boundary', handleBoundary);
        window.addEventListener('tts-end', handleEnd);
        return () => {
            window.removeEventListener('tts-boundary', handleBoundary);
            window.removeEventListener('tts-end', handleEnd);
        };
    }, [isPlaying, sentence.swedish_sentence]);

    const displayedText = sentence.swedish_sentence;
    const arabicText = (sentence.arabic_translation || '').trim();

    const showSv = true;
    const showAr = arabicText.length > 0;

    const renderWithHighlights = (text: string) => {
        const allWords: string[] = [];
        swedishWords.forEach(w => {
            const parts = w.swedish.split(',').map(p => p.trim());
            allWords.push(...parts);
        });

        const sortedWords = allWords.filter(w => w.length > 0).sort((a, b) => b.length - a.length);
        const pattern = sortedWords.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');

        // Match keywords OR sequences of whitespace OR anything else (word-by-word splitting)
        const regexPattern = pattern ? `(\\b(?:${pattern})\\b|\\s+|\\S+)` : `(\\s+|\\S+)`;
        const regex = new RegExp(regexPattern, 'gi');

        let currentCharOffset = 0;

        return (
            <>
                {text.split(regex).filter(Boolean).map((part, i) => {
                    const startPos = currentCharOffset;
                    currentCharOffset += part.length;

                    const isKeyword = sortedWords.some(w => w.toLowerCase() === part.toLowerCase());
                    // Word is active if the current char index falls within this part
                    const isBeingSpoken = activeCharIndex >= startPos && activeCharIndex < currentCharOffset;

                    const classes = [
                        isKeyword ? 'story-highlight' : '',
                        isBeingSpoken ? 'word-active' : ''
                    ].filter(Boolean).join(' ');

                    if (isKeyword || isBeingSpoken) {
                        return (
                            <span
                                key={i}
                                className={classes}
                                onClick={isKeyword ? (e) => {
                                    e.stopPropagation();
                                    playAudio(part, -99);
                                } : undefined}
                            >
                                {part}
                            </span>
                        );
                    }
                    return <span key={i}>{part}</span>;
                })}
            </>
        );
    };

    return (
        <div
            className={`story-sentence-pair-container ${isPlaying ? 'playing' : ''}`}
            onClick={() => playAudio(sentence.swedish_sentence, idx, sentence.arabic_translation)}
            key={idx}
        >
            {/* Swedish Section */}
            {showSv && (
                <div className="swedish-sentence-box sv-line">
                    <span className="play-icon">{isPlaying ? '🔊' : '▶️'}</span>
                    <p className="story-content-sv">{renderWithHighlights(displayedText)}</p>
                </div>
            )}

            {/* Arabic Section */}
            {showAr && (
                <p className="story-content-ar ar-fixed" dir="rtl" lang="ar">
                    {arabicText}
                </p>
            )}
        </div>
    );
};

const StoryModal: React.FC<StoryModalProps> = ({ story, swedishWords, onClose, isVisible }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [currentlyPlaying, setCurrentlyPlaying] = useState<number | 'all' | null>(null);

    // Language State
    const [currentLang, setCurrentLang] = useState<Language>(LanguageManager.getLanguage());

    useEffect(() => {
        // Subscribe to language changes
        const updateLang = (lang: Language) => setCurrentLang(lang);
        LanguageManager.onLanguageChange(updateLang);

        // Initial set
        setCurrentLang(LanguageManager.getLanguage());

        return () => {
        };
    }, []);

    useEffect(() => {
        if (isVisible) {
            setIsAnimating(true);

            // Play Ta-da sound!
            if (typeof window !== 'undefined' && (window as any).AudioManager) {
                (window as any).AudioManager.playSuccessSound();
            }

            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const stopAudio = () => {
        TTSManager.stop();
        setCurrentlyPlaying(null);
    };

    const playAudio = (text: string, id: number | 'all') => {
        if (currentlyPlaying !== null) {
            stopAudio();
            if (currentlyPlaying === id) return;
        }

        try {
            TTSManager.speak(text, 'sv', {
                onStart: () => setCurrentlyPlaying(id),
                onEnd: () => setCurrentlyPlaying(null),
                onError: () => setCurrentlyPlaying(null)
            });
        } catch (error) {
            console.error('Error playing audio:', error);
            setCurrentlyPlaying(null);
        }
    };

    const handlePlayFullStory = () => {
        const fullText = story.sentences.map(s => s.swedish_sentence).join(' ');
        playAudio(fullText, 'all');
    };

    const handleCopyText = async () => {
        try {
            const svText = story.sentences.map(s => s.swedish_sentence).join('\n');
            const arText = story.sentences.map(s => s.arabic_translation).join('\n');
            await navigator.clipboard.writeText(`${story.title_sv}\n${svText}\n\n${story.title_ar}\n${arText}`);
            if ((window as any).showToast) (window as any).showToast('📋 تم نسخ القصة!');
        } catch (error) {
            console.error('Error copying text:', error);
        }
    };

    if (!isVisible) return null;

    const showSvTitle = true; // Always show Swedish title (Target Language)
    const showArTitle = true; // Always show Arabic title (Context)

    return (
        <div className={`story-modal-overlay ${isAnimating ? 'animating' : ''}`}>
            <div className={`glass-card story-container ${isAnimating ? 'scale-up' : ''}`}>
                <header className="story-header">
                    <div className="story-title">
                        <span className="emoji">📖</span>
                        <div className="title-group">
                            {showSvTitle && <h3 className="sv-title">{story.title_sv}</h3>}
                            {showArTitle && <h4 className="ar-title">{story.title_ar}</h4>}
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="close-btn" onClick={onClose}>✕</button>
                    </div>
                </header>

                <div className="story-narrative-block">
                    {story.sentences && story.sentences.map((sentence, idx) => (
                        <StorySentenceView
                            key={idx}
                            sentence={sentence}
                            idx={idx}
                            isPlaying={currentlyPlaying === idx}
                            playAudio={playAudio}
                            swedishWords={swedishWords}
                        />
                    ))}
                </div>

                {/* Word Tags */}
                <div className="word-tags-section">
                    <h4>الكلمات المشمولة في القصة:</h4>
                    <div className="word-tags">
                        {swedishWords.map((word) => (
                            <span
                                key={word.id}
                                className="word-badge"
                                onClick={() => playAudio(word.swedish.includes(',') ? word.swedish.split(',')[0] : word.swedish, -88)}
                                title="اسمع الكلمة"
                            >
                                <span className="swedish-word">{word.swedish}</span>
                                <span className="arabic-meaning">{word.arabic}</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="modal-actions">
                    <button
                        className={`action-btn audio-btn ${currentlyPlaying === 'all' ? 'playing' : ''}`}
                        onClick={handlePlayFullStory}
                    >
                        <span className="emoji">{currentlyPlaying === 'all' ? '⏹️' : '🔊'}</span>
                        {currentlyPlaying === 'all' ? 'إيقاف' : 'استمع للقصة كاملة'}
                    </button>

                    <button className="action-btn copy-btn" onClick={handleCopyText}>
                        <span className="emoji">📋</span>
                        نسخ النص
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StoryModal;