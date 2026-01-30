import React from 'react';

interface QuickAccessRowProps {
    onQuickAction?: (action: 'quiz' | 'flashcards') => void;
}

export const QuickAccessRow: React.FC<QuickAccessRowProps> = ({ onQuickAction }) => {
    // Navigation handlers
    const navTo = (url: string) => {
        window.location.href = url;
    };

    const handleRandomQuiz = () => {
        if (onQuickAction) {
            onQuickAction('quiz');
        } else {
            console.log('Open Random Quiz - Handler not provided');
        }
    };

    return (
        <div className="quick-access-row">
            <button type="button" className="squircle-btn" onClick={() => navTo('quran.html')}
                title="Koranord / كلمات القرآن">
                <span className="squircle-icon">📖</span>
            </button>
            <button type="button" className="squircle-btn" onClick={() => navTo('asma_ul_husna.html')}
                title="Guds 99 Namn / أسماء الله الحسنى">
                <span className="squircle-icon">📿</span>
            </button>
            <button type="button" className="squircle-btn" onClick={() => navTo('ordsprak.html')}
                title="Svenska Ordspråk / الأمثال السويدية">
                <span className="squircle-icon">📜</span>
            </button>
            <button type="button" className="squircle-btn" onClick={() => navTo('cognates.html')}
                title="Liknande Ord / المتشابهات">
                <span className="squircle-icon">🔤</span>
            </button>
            <button type="button" className="squircle-btn" onClick={handleRandomQuiz} title="Slumpmässig Quiz / اختبار عشوائي">
                <span className="squircle-icon">🎲</span>
            </button>
        </div>
    );
};
