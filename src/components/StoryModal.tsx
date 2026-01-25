import React, { useState, useEffect } from 'react';
import './StoryModal.css';
import { TTSManager } from '../tts';
import { AIService } from '../services/aiService';

interface Word {
    id: string;
    swedish: string;
    arabic: string;
}

interface Sentence {
    sv: string;
    ar: string;
}

interface Story {
    title_sv: string;
    title_ar: string;
    sentences: Sentence[];
}

interface StoryModalProps {
    story: Story;
    swedishWords: Word[];
    onClose: () => void;
    isVisible: boolean;
}

const StoryModal: React.FC<StoryModalProps> = ({ story, swedishWords, onClose, isVisible }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [currentlyPlaying, setCurrentlyPlaying] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handlePlayAudio = async () => {
        if (currentlyPlaying) {
            speechSynthesis.cancel();
            setCurrentlyPlaying(false);
            return;
        }

        try {
            const fullText = story.sentences.map(s => s.sv).join(' ');
            const utterance = new SpeechSynthesisUtterance(fullText);

            // البحث عن أفضل صوت سويدي متاح
            const voices = speechSynthesis.getVoices();
            const swedishVoice = voices.find(v => v.lang.startsWith('sv')) ||
                voices.find(v => v.lang === 'sv-SE');

            if (swedishVoice) {
                utterance.voice = swedishVoice;
            }

            utterance.lang = 'sv-SE';
            utterance.rate = 0.8; // أبطأ قليلاً للوضوح
            utterance.pitch = 1.0;

            utterance.onstart = () => setCurrentlyPlaying(true);
            utterance.onend = () => setCurrentlyPlaying(false);
            utterance.onerror = () => setCurrentlyPlaying(false);

            speechSynthesis.speak(utterance);
        } catch (error) {
            console.error('Error playing audio:', error);
            setCurrentlyPlaying(false);
        }
    };

    const handleCopyText = async () => {
        try {
            const svText = story.sentences.map(s => s.sv).join('\n');
            const arText = story.sentences.map(s => s.ar).join('\n');
            await navigator.clipboard.writeText(`${story.title_sv}\n${svText}\n\n${story.title_ar}\n${arText}`);

            if ((window as any).showToast) {
                (window as any).showToast('📋 تم نسخ القصة بنجاح!');
            }
        } catch (error) {
            console.error('Error copying text:', error);
        }
    };

    // Helper function to highlight used words in text
    const renderWithHighlights = (text: string) => {
        if (!swedishWords || swedishWords.length === 0) return text;

        // Sort words by length descending to avoid partial matches (e.g., matching 'word' in 'words')
        const sortedWords = [...swedishWords].sort((a, b) => b.swedish.length - a.swedish.length);

        // Escape words for regex and join with OR
        const pattern = sortedWords.map(w => w.swedish.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
        if (!pattern) return text;

        const regex = new RegExp(`(${pattern})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, i) => {
            const isMatch = sortedWords.some(w => w.swedish.toLowerCase() === part.toLowerCase());
            if (isMatch) {
                return <span key={i} className="story-highlight">{part}</span>;
            }
            return part;
        });
    };

    if (!isVisible) return null;

    console.log('[StoryModal] Rendering story:', story);

    return (
        <div className={`story-modal-overlay ${isAnimating ? 'animating' : ''}`}>
            <div className={`glass-card story-container ${isAnimating ? 'scale-up' : ''}`}>
                {/* Header */}
                <header className="story-header">
                    <div className="story-title">
                        <span className="emoji">📝</span>
                        <div className="title-group">
                            <h3 className="sv-title">{story.title_sv}</h3>
                            <h4 className="ar-title">{story.title_ar}</h4>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose} title="إغلاق">✕</button>
                </header>

                {/* Story Content - Unified Narrative Flow */}
                <div className="story-content narrative-flow">
                    {story.sentences && story.sentences.length > 0 ? (
                        story.sentences.map((sentence: any, idx) => {
                            // Robust key checking for translation (ar, translation, or arabic)
                            const arabicText = sentence.ar || sentence.translation || sentence.arabic;

                            return (
                                <div key={idx} className="sentence-block">
                                    <p className="sv-sentence">{renderWithHighlights(sentence.sv)}</p>
                                    <p className="ar-sentence" dir="rtl">
                                        {arabicText || <span className="translation-missing">(الترجمة غير متوفرة لهذه الجملة)</span>}
                                    </p>
                                </div>
                            );
                        })
                    ) : (
                        <p className="error-text">عذراً، لم يتم العثور على محتوى للقصة.</p>
                    )}
                </div>

                {/* Word Tags */}
                <div className="word-tags-section">
                    <h4>الكلمات المشمولة في القصة:</h4>
                    <div className="word-tags">
                        {swedishWords.map((word) => (
                            <span key={word.id} className="word-badge">
                                <span className="swedish-word">{word.swedish}</span>
                                <span className="arabic-meaning">{word.arabic}</span>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="modal-actions">
                    <button
                        className={`action-btn audio-btn ${currentlyPlaying ? 'playing' : ''}`}
                        onClick={handlePlayAudio}
                    >
                        <span className="emoji">{currentlyPlaying ? '⏹️' : '🔊'}</span>
                        {currentlyPlaying ? 'إيقاف' : 'استمع للقصة'}
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