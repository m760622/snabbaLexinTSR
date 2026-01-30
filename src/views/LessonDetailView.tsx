
import React, { useEffect, useMemo, useState } from 'react';
import { lessonsData, Lesson, LessonSection, ExampleItem, ContentItem } from '../learn/lessonsData';
import { TTSManager } from '../tts';
import { normalizeArabic } from '../utils';
import '../../assets/css/lesson-detail-terminal.css';

interface LessonDetailViewProps {
    lessonId: string;
    onStartQuiz: (lessonId: string) => void;
}

export const LessonDetailView: React.FC<LessonDetailViewProps> = ({ lessonId, onStartQuiz }) => {
    const [isLoading, setIsLoading] = useState(true);

    // Find Lesson
    const lesson = useMemo(() => {
        return lessonsData.find(l => l.id === lessonId);
    }, [lessonId]);

    // Calculate metadata
    const stats = useMemo(() => {
        if (!lesson) return null;
        let totalExamples = 0;
        lesson.sections.forEach(s => totalExamples += s.examples.length);
        return {
            sectionCount: lesson.sections.length,
            exampleCount: totalExamples,
            timestamp: new Date().toLocaleTimeString(),
            status: "ANALYSIS_COMPLETE"
        };
    }, [lesson]);

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
            <div className="terminal-view view-section active p-10 text-center min-h-screen">
                <h2 className="terminal-title">Error: 404_DATA_NOT_FOUND</h2>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="terminal-view view-section active p-10 text-center min-h-screen">
                <div className="terminal-title animate-pulse">SYSTEM_LOADING...</div>
            </div>
        );
    }

    return (
        <div id="lessonView" className="terminal-view view-section active fade-in w-full pb-32 min-h-screen p-4">
            {/* Header / Nav */}
            <div className="terminal-header flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <h1 className="terminal-title text-xl font-bold flex-1 truncate">{lesson.title}</h1>
                </div>

                {/* System Info Row */}
                <div className="flex flex-wrap gap-2 mt-2">
                    <span className="terminal-meta-chip">DATA_BLOCKS: {stats?.sectionCount}</span>
                    <span className="terminal-meta-chip">REF_EXAMPLES: {stats?.exampleCount}</span>
                    <span className="terminal-meta-chip hidden sm:inline-block">LOAD_TIME: {stats?.timestamp}</span>
                    <span className={`terminal-meta-chip text-xs ${lesson.level === 'beginner' ? 'text-green-400' : lesson.level === 'intermediate' ? 'text-amber-400' : 'text-red-400'}`}>
                        LEVEL: {lesson.level.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="lesson-content-container space-y-8 max-w-2xl mx-auto">
                {lesson.sections.map((section, idx) => (
                    <section key={idx} className="terminal-section group">
                        <h2 className="terminal-section-title">
                            {section.title}
                        </h2>

                        {/* Content Blocks */}
                        <div className="terminal-content mb-6 space-y-4">
                            {section.content.map((block, bIdx) => (
                                <div key={bIdx} className="content-block">
                                    <div dangerouslySetInnerHTML={{ __html: block.html }} />
                                </div>
                            ))}
                        </div>

                        {/* Examples */}
                        {section.examples.length > 0 && (
                            <div className="examples-container mt-6">
                                <div className="text-[10px] text-accent/50 mb-3 border-b border-accent/20 pb-1 font-mono uppercase tracking-[3px]">
                                    Extracted_References / أمثلة
                                </div>
                                <div className="grid gap-3">
                                    {section.examples.map((ex, exIdx) => (
                                        <div
                                            key={exIdx}
                                            className="terminal-example group/ex cursor-pointer"
                                            onClick={() => playAudio(ex.swe)}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <p className="swe-text text-base mb-1 tracking-wide">
                                                        <span className="text-accent/40 mr-2 opacity-50">[{exIdx + 1}]</span>
                                                        {ex.swe}
                                                    </p>
                                                    <p className="arb-text text-base" dir="rtl" lang="ar">{ex.arb}</p>
                                                </div>
                                                <div className="flex flex-col items-center justify-center h-full opacity-30 group-hover/ex:opacity-100 transition-opacity">
                                                    <span className="text-accent text-xl">🔊</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Section ID tag */}
                        <div className="absolute top-2 right-2 text-[8px] text-accent/20 font-mono">
                            SEC_ID: {idx.toString().padStart(3, '0')}
                        </div>
                    </section>
                ))}
            </div>

            {/* Sticky Footer Action */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-950/80 backdrop-blur-md border-t border-accent/20 flex justify-center z-50">
                <button
                    onClick={() => onStartQuiz(lesson.id)}
                    className="terminal-btn min-w-[280px] text-sm"
                >
                    INITIALIZE_QUIZ_PROCEDURE
                </button>
            </div>
        </div>
    );
};
