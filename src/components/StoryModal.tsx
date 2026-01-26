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



// Extracted Component to prevent re-renders
const TypewriterSentence: React.FC<{
    sentence: StorySentence,
    idx: number,
    isPlaying: boolean,
    playAudio: Function,
    swedishWords: Word[],
    highlightIndex: number | null
}> = ({ sentence, idx, isPlaying, playAudio, swedishWords, highlightIndex }) => {
    // Direct rendering to prevent typewriter glitches
    const displayedText = sentence.swedish_sentence;

    const arabicText = sentence.arabic_translation && sentence.arabic_translation.trim().length > 0
        ? sentence.arabic_translation
        : "⚠️ لم يتم استلام الترجمة";

    // Visibility Logic - ALWAYS VISIBLE
    // Content is King. UI Language should not hide learning content.
    const showSv = true;
    const showAr = true;

    // Helper for highlights
    const renderWithHighlights = (text: string) => {
        const allWords: string[] = [];
        swedishWords.forEach(w => {
            const parts = w.swedish.split(',').map(p => p.trim());
            allWords.push(...parts);
        });

        const sortedWords = allWords.filter(w => w.length > 0).sort((a, b) => b.length - a.length);
        const pattern = sortedWords.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');

        // If no keywords, treating the whole text as plain text but splitable for karaoke
        const regex = pattern ? new RegExp(`\\b(${pattern})\\b`, 'gi') : null;

        const parts = regex ? text.split(regex) : [text];
        let globalCharIndex = 0;

        return (
            <>
                {parts.map((part, i) => {
                    const currentStartIndex = globalCharIndex;
                    globalCharIndex += part.length;

                    // Check if this part is a Keyword
                    const isKeyword = regex && sortedWords.some(w => w.toLowerCase() === part.toLowerCase());

                    if (isKeyword) {
                        // For keywords, we highlight the whole block if the playing index falls inside it
                        const isActive = isPlaying && highlightIndex !== null &&
                            highlightIndex >= currentStartIndex &&
                            highlightIndex < (currentStartIndex + part.length);

                        return (
                            <span
                                key={i}
                                className={`story-highlight ${isActive ? 'karaoke-word' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    playAudio(part, -99);
                                }}
                            >
                                {part}
                            </span>
                        );
                    } else {
                        // Plain text - Split by spaces to allow word-level highlighting
                        // We use a regex that captures delimiters so we don't lose them
                        return part.split(/(\s+)/).map((subPart, j) => {
                            const subStart = currentStartIndex + part.substring(0, part.indexOf(subPart, 0)).length;
                            // Wait, logic above is flawed for repeats.
                            // Better: Calculate exact offset relative to `part` start.
                        });
                    }
                })}
            </>
        );
    };

    // Correct Iterative Rendering for Karaoke
    const renderKaraokeText = (text: string) => {
        const nodes: React.ReactNode[] = [];

        let cursor = 0; // Tracks position in original string

        // 1. Identify Keyword Ranges
        const keywordRanges: { start: number, end: number, word: string }[] = [];
        if (swedishWords.length > 0) {
            const allWords = swedishWords.flatMap(w => w.swedish.split(',').map(p => p.trim())).filter(w => w.length > 0);
            // Sort by length desc to prioritize longest match
            const sorted = allWords.sort((a, b) => b.length - a.length);
            const pattern = sorted.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
            if (pattern) {
                const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');
                let match;
                while ((match = regex.exec(text)) !== null) {
                    keywordRanges.push({ start: match.index, end: match.index + match[0].length, word: match[0] });
                }
            }
        }

        // 2. Process text linearly
        // We will jump over keyword ranges.
        let currentPos = 0;

        // Sort ranges by start position
        keywordRanges.sort((a, b) => a.start - b.start);
        // Filter overlaps (basic strategy: first wins)
        const uniqueRanges: typeof keywordRanges = [];
        let lastEnd = 0;
        for (const r of keywordRanges) {
            if (r.start >= lastEnd) {
                uniqueRanges.push(r);
                lastEnd = r.end;
            }
        }

        uniqueRanges.forEach((range, idx) => {
            // A. Render non-keyword text before this keyword
            if (range.start > currentPos) {
                const segment = text.substring(currentPos, range.start);
                nodes.push(...renderPlainSegment(segment, currentPos));
            }

            // B. Render Keyword
            const isKaraoke = isPlaying && highlightIndex !== null &&
                highlightIndex >= range.start && highlightIndex < range.end;

            nodes.push(
                <span
                    key={`kw-${range.start}`}
                    className={`story-highlight ${isKaraoke ? 'karaoke-word' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        playAudio(range.word, -99);
                    }}
                >
                    {range.word}
                </span>
            );

            currentPos = range.end;
        });

        // C. Render remaining text
        if (currentPos < text.length) {
            nodes.push(...renderPlainSegment(text.substring(currentPos), currentPos));
        }

        return <>{nodes}</>;
    };

    const renderPlainSegment = (segment: string, offset: number) => {
        // Split by spaces but preserve them
        const parts = segment.split(/(\s+)/);
        let localOffset = 0;
        return parts.map((part, i) => {
            const start = offset + localOffset;
            localOffset += part.length;

            if (!part.trim()) return <span key={`s-${start}`}>{part}</span>; // Space/Whitespace

            const isKaraoke = isPlaying && highlightIndex !== null &&
                highlightIndex >= start && highlightIndex < (start + part.length); // Loose match

            return (
                <span key={`w-${start}`} className={isKaraoke ? 'karaoke-word' : ''}>
                    {part}
                </span>
            );
        });
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
                    <p className="story-content-sv">{renderKaraokeText(displayedText)}</p>
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
    const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
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
        setHighlightIndex(null);
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

            utterance.onboundary = (event) => {
                if (event.name === 'word') {
                    setHighlightIndex(event.charIndex);
                }
            };

            utterance.onend = () => {
                setCurrentlyPlaying(null);
                setHighlightIndex(null);
            };

            utterance.onerror = () => {
                setCurrentlyPlaying(null);
                setHighlightIndex(null);
            };

            speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Error playing audio:', error);
            setCurrentlyPlaying(null);
            setHighlightIndex(null);
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
                        <TypewriterSentence
                            key={idx}
                            sentence={sentence}
                            idx={idx}
                            isPlaying={currentlyPlaying === idx}
                            playAudio={playAudio}
                            swedishWords={swedishWords}
                            highlightIndex={currentlyPlaying === idx || currentlyPlaying === 'all' ? highlightIndex : null}
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