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

interface Story {
    title_sv: string;
    title_ar: string;
    sentences: StorySentence[];
}

interface StoryModalProps {
    story: Story;
    swedishWords: Word[];
    onClose: () => void;
    isVisible: boolean;
}

const useTypewriter = (text: string, speed: number = 20, isEnabled: boolean = true) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        if (!isEnabled || !text) {
            setDisplayedText(text || '');
            return;
        }

        setDisplayedText(''); // Reset on new text
        let i = 0;
        const timer = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(timer);
            }
        }, speed);

        return () => clearInterval(timer);
    }, [text, speed, isEnabled]);

    return displayedText;
};

// Extracted Component to prevent re-renders
const TypewriterSentence: React.FC<{
    sentence: StorySentence,
    idx: number,
    isPlaying: boolean,
    playAudio: Function,
    swedishWords: Word[],
    currentLang: Language
}> = ({ sentence, idx, isPlaying, playAudio, swedishWords, currentLang }) => {
    const typeWrittenText = useTypewriter(sentence.swedish_sentence, 20);

    const arabicText = sentence.arabic_translation && sentence.arabic_translation.trim().length > 0
        ? sentence.arabic_translation
        : "⚠️ لم يتم استلام الترجمة";

    // Visibility Logic
    const showSv = currentLang === 'sv' || currentLang === 'both';
    const showAr = currentLang === 'ar' || currentLang === 'both';

    // Helper for highlights
    const renderWithHighlights = (text: string) => {
        const allWords: string[] = [];
        swedishWords.forEach(w => {
            const parts = w.swedish.split(',').map(p => p.trim());
            allWords.push(...parts);
        });

        const sortedWords = allWords.filter(w => w.length > 0).sort((a, b) => b.length - a.length);
        const pattern = sortedWords.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
        if (!pattern) return <>{text}</>;

        const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
        return (
            <>
                {text.split(regex).map((part, i) => {
                    const isMatch = sortedWords.some(w => w.toLowerCase() === part.toLowerCase());
                    if (isMatch) {
                        return (
                            <span
                                key={i}
                                className="story-highlight"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    playAudio(part, -99);
                                }}
                            >
                                {part}
                            </span>
                        );
                    }
                    return part;
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
                    <p className="story-sv-text">{renderWithHighlights(typeWrittenText)}</p>
                </div>
            )}

            {/* Arabic Section */}
            {showAr && sentence.arabic_translation && (
                <p className="story-ar-text ar-fixed" dir="rtl" lang="ar">
                    {sentence.arabic_translation}
                </p>
            )}
        </div>
    );
};

const StoryModal: React.FC<StoryModalProps> = ({ story, swedishWords, onClose, isVisible }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [currentlyPlaying, setCurrentlyPlaying] = useState<number | 'all' | null>(null);
    const [showAllTranslations, setShowAllTranslations] = useState(true);
    const [pageType, setPageType] = useState('story');

    // Language State
    const [currentLang, setCurrentLang] = useState<Language>(LanguageManager.getLanguage());

    useEffect(() => {
        // Subscribe to language changes
        const updateLang = (lang: Language) => setCurrentLang(lang);
        LanguageManager.onLanguageChange(updateLang);

        // Initial set
        setCurrentLang(LanguageManager.getLanguage());

        return () => {
            // No unsubscribe method in LanguageManager based on interface, 
            // but for a modal that unmounts mostly on app refresh it's okay, 
            // or we can add removal logic if available.
            // Assuming no memory leak for now as per minimal architecture.
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
        speechSynthesis.cancel();
        setCurrentlyPlaying(null);
    };

    const playAudio = (text: string, id: number | 'all') => {
        if (currentlyPlaying !== null) {
            stopAudio();
            if (currentlyPlaying === id) return;
        }

        try {
            const utterance = new SpeechSynthesisUtterance(text);
            const voices = speechSynthesis.getVoices();
            const swedishVoice = voices.find(v => v.lang.startsWith('sv')) || voices.find(v => v.lang === 'sv-SE');

            if (swedishVoice) utterance.voice = swedishVoice;
            utterance.lang = 'sv-SE';
            utterance.rate = 0.8;

            utterance.onstart = () => {
                setCurrentlyPlaying(id);
            };
            utterance.onend = () => setCurrentlyPlaying(null);
            utterance.onerror = () => setCurrentlyPlaying(null);

            speechSynthesis.speak(utterance);
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

    const showSvTitle = currentLang === 'sv' || currentLang === 'both';
    const showArTitle = currentLang === 'ar' || currentLang === 'both';

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
                        <button
                            className={`toggle-all-btn ${showAllTranslations ? 'active' : ''}`}
                            onClick={() => setShowAllTranslations(!showAllTranslations)}
                            title={showAllTranslations ? 'إخفاء الترجمة' : 'عرض الترجمة'}
                        >
                            {showAllTranslations ? '👁️ إخفاء' : '👁️‍🗨️ عرض'}
                        </button>
                        <button className="close-btn" onClick={onClose}>✕</button>
                    </div>
                </header>

                <div className="story-narrative-block">
                    {story.sentences && story.sentences.map((sentence, idx) => (
                        <TypewriterSentence
                            key={idx}
                            sentence={sentence}
                            idx={idx}
                            isPlaying={currentlyPlaying === idx}
                            playAudio={playAudio}
                            swedishWords={swedishWords}
                            currentLang={currentLang}
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