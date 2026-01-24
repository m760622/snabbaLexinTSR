import React, { useState, useEffect } from 'react';
import './StoryModal.css';
import { TTSManager } from '../tts';
import { AIService } from '../services/aiService';

interface Word {
    id: string;
    swedish: string;
    arabic: string;
}

interface Story {
    text: string;
    translation: string;
}

interface StoryModalProps {
    story: Story;
    swedishWords: Word[];
    onClose: () => void;
    isVisible: boolean;
}

const StoryModal: React.FC<StoryModalProps> = ({ story, swedishWords, onClose, isVisible }) => {
    const [showTranslation, setShowTranslation] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isVisible]);

    const handlePlayAudio = async () => {
        try {
            // استخدام Web Speech API مباشرةً
            const utterance = new SpeechSynthesisUtterance(story.text);
            utterance.lang = 'sv-SE';
            utterance.rate = 0.85;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            speechSynthesis.speak(utterance);
        } catch (error: any) {
            console.error('Error playing audio:', error);
            // Fallback: استخدام AudioManager إذا كان متوفراً
            if ((window as any).AudioManager) {
                try {
                    await (window as any).AudioManager.play(story.text, 'sv');
                } catch (fallbackError) {
                    console.error('Fallback audio failed:', fallbackError);
                }
            }
        }
    };

    const handleCopyText = async () => {
        try {
            const fullText = `${story.text}\n\n${story.translation}`;
            await navigator.clipboard.writeText(fullText);

            // عرض رسالة نجاح
            if ((window as any).showToast) {
                (window as any).showToast('📋 تم نسخ القصة بنجاح!');
            }
        } catch (error) {
            console.error('Error copying text:', error);
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`story-modal-overlay ${isAnimating ? 'animating' : ''}`}>
            <div className={`glass-card story-container ${isAnimating ? 'scale-up' : ''}`}>
                {/* Header */}
                <header className="story-header">
                    <div className="story-title">
                        <span className="emoji">📖</span>
                        <h3>قصتك التعليمية</h3>
                    </div>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        aria-label="إغلاق النافذة"
                    >
                        ✕
                    </button>
                </header>

                {/* Story Content */}
                <div className="story-content">
                    {/* Swedish Text */}
                    <div className="swedish-section">
                        <p className="swedish-text">{story.text}</p>
                    </div>

                    {/* Translation Toggle */}
                    <button
                        className="translation-toggle"
                        onClick={() => setShowTranslation(!showTranslation)}
                    >
                        {showTranslation ? 'إخفاء الترجمة' : 'عرض الترجمة'}
                        <span className={`arrow ${showTranslation ? 'up' : 'down'}`}>▼</span>
                    </button>

                    {/* Arabic Translation */}
                    {showTranslation && (
                        <div className="arabic-section">
                            <hr className="divider" />
                            <p className="arabic-translation">{story.translation}</p>
                        </div>
                    )}
                </div>

                {/* Word Tags */}
                <div className="word-tags-section">
                    <h4>الكلمات المستخدمة:</h4>
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
                        className="action-btn audio-btn"
                        onClick={handlePlayAudio}
                    >
                        <span className="emoji">🔊</span>
                        استمع للقصة
                    </button>

                    <button
                        className="action-btn copy-btn"
                        onClick={handleCopyText}
                    >
                        <span className="emoji">📋</span>
                        نسخ النص
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StoryModal;