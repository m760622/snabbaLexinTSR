
import React, { useEffect, useMemo, useState } from 'react';
import { lessonsData, Lesson, LessonSection, ExampleItem, ContentItem } from '../learn/lessonsData';
import { TTSManager } from '../tts';
import { normalizeArabic } from '../utils';

interface LessonDetailViewProps {
    lessonId: string;
    onBack: () => void;
    onStartQuiz: (lessonId: string) => void;
}

export const LessonDetailView: React.FC<LessonDetailViewProps> = ({ lessonId, onBack, onStartQuiz }) => {
    const [isLoading, setIsLoading] = useState(true);

    // Find Lesson
    const lesson = useMemo(() => {
        return lessonsData.find(l => l.id === lessonId);
    }, [lessonId]);

    // TTS Hook
    const playAudio = (text: string) => {
        TTSManager.speak(text);
    };

    // Scroll to top on mount
    useEffect(() => {
        window.scrollTo(0, 0);
        setTimeout(() => setIsLoading(false), 300);
    }, [lessonId]);

    if (!lesson) {
        return (
            <div className="view-section active p-10 text-center">
                <h2>Lektionen hittades inte</h2>
                <button onClick={onBack} className="primary-btn mt-4">Tillbaka</button>
            </div>
        );
    }

    if (isLoading) {
        return <div className="view-section active p-10 text-center">Laddar lektion...</div>;
    }

    return (
        <div id="lessonView" className="view-section active fade-in w-full pb-32">
            {/* Header / Nav */}
            <div className="lesson-nav mb-6 flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="back-btn p-2 rounded-full hover:bg-white/5 active:scale-95 transition-all"
                    aria-label="Tillbaka"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <h1 className="text-xl font-bold flex-1">{lesson.title}</h1>
            </div>

            <div className="lesson-content-container space-y-8">
                {lesson.sections.map((section, idx) => (
                    <section key={idx} className="lesson-section bg-surface glass-card p-6 rounded-2xl border border-white/5 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4 text-accent border-b border-white/10 pb-2">
                            {section.title}
                        </h2>

                        {/* Content Blocks */}
                        {section.content.map((block, bIdx) => (
                            <div key={bIdx} className="content-block mb-4 text-gray-200 leading-relaxed">
                                {/* Using dangerouslySetInnerHTML because data contains <strong>, <em> etc */}
                                <div dangerouslySetInnerHTML={{ __html: block.html }} />
                            </div>
                        ))}

                        {/* Examples */}
                        {section.examples.length > 0 && (
                            <div className="examples-container mt-6 space-y-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Exempel / أمثلة</h3>
                                {section.examples.map((ex, exIdx) => (
                                    <div key={exIdx} className="example-item bg-black/20 p-4 rounded-xl border border-white/5 hover:border-accent/30 transition-colors group cursor-pointer" onClick={() => playAudio(ex.swe)}>
                                        <div className="flex justify-between items-start gap-3">
                                            <div className="flex-1">
                                                <p className="swe-text font-medium text-lg text-white mb-1">{ex.swe}</p>
                                                <p className="arb-text text-gray-400 text-lg" dir="rtl" lang="ar">{ex.arb}</p>
                                            </div>
                                            <button className="audio-btn opacity-50 group-hover:opacity-100 p-2 text-accent" aria-label="Lyssna">
                                                🔊
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                ))}
            </div>

            {/* Sticky Footer Action */}
            <div className="lesson-footer fixed bottom-0 left-0 right-0 p-4 bg-surface/95 backdrop-blur-lg border-t border-white/10 flex justify-center z-50">
                <button
                    onClick={() => onStartQuiz(lesson.id)}
                    className="primary-btn w-full max-w-md shadow-lg shadow-accent/20"
                >
                    Starta Quiz / اختبار
                </button>
            </div>
        </div>
    );
};
