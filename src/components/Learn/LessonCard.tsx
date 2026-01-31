
import React, { useRef, useState } from 'react';
import type { Lesson } from '../../learn/lessonsData';

interface LessonCardProps {
    lesson: Lesson;
    isCompleted: boolean;
    onClick: (lessonId: string) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, isCompleted, onClick }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    // Tilt State
    const [transformStyle, setTransformStyle] = useState('');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const levelColors: Record<string, string> = {
        'beginner': '#22c55e',
        'intermediate': '#eab308',
        'advanced': '#ef4444'
    };

    const levelEmoji: Record<string, string> = {
        'beginner': '🟢',
        'intermediate': '🟡',
        'advanced': '🔴'
    };

    // Subtitle Mapping (hardcoded for now to match legacy)
    const getSubTitle = (id: string) => {
        const map: Record<string, string> = {
            'wordOrder': 'ترتيب الكلمات - قاعدة V2',
            'verbs': 'الأفعال والأزمنة',
            'pronouns': 'الضمائر الشخصية',
            'adjectives': 'الصفات - التذكير والتأنيث'
        };
        return map[id] || 'درس قواعد';
    };

    const handleTilt = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = cardRef.current;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setMousePos({ x, y }); // For CSS variables if needed

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10; // Max 10deg
        const rotateY = ((x - centerX) / centerX) * 10;

        setTransformStyle(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`);
    };

    const resetTilt = () => {
        setTransformStyle('perspective(1000px) rotateX(0) rotateY(0) scale(1)');
        setMousePos({ x: 0, y: 0 });
    };

    const totalExamples = lesson.sections.reduce((acc, s) => acc + s.examples.length, 0);
    const sectionsText = `${lesson.sections.length} Avsnitt / أقسام`;
    const examplesText = `${totalExamples} Exempel / أمثلة`;

    return (
        <div
            ref={cardRef}
            className={`lesson-card search-result-style ${isCompleted ? 'completed' : ''}`}
            onClick={() => onClick(lesson.id)}
            data-level={lesson.level}
            onMouseMove={handleTilt}
            onMouseLeave={resetTilt}
            style={{
                transform: transformStyle,
                // Pass mouse position to CSS if needed (some effects use it)
                ['--mouse-x' as any]: `${mousePos.x}px`,
                ['--mouse-y' as any]: `${mousePos.y}px`
            }}
        >
            <div className="lesson-card-header">
                <div className="lesson-text-group">
                    <h2 className="lesson-title search-result-title">{lesson.title}</h2>
                </div>
                {isCompleted && <span className="check-icon">✓</span>}
            </div>

            <p className="lesson-subtitle-arb" dir="rtl">{getSubTitle(lesson.id)}</p>

            <div className="lesson-meta-row">
                <span className="meta-item"><span className="icon">📄</span> {sectionsText}</span>
                <span className="meta-item"><span className="icon">📝</span> {examplesText}</span>
            </div>

            {isCompleted && (
                <div className="mastery-stars">
                    <span className="star active">★</span>
                    <span className="star active">★</span>
                    <span className="star active">★</span>
                </div>
            )}

            <div className="lesson-progress-bar">
                <div
                    className="lesson-progress-fill"
                    style={{ width: isCompleted ? '100%' : '0%' }}
                />
            </div>
        </div>
    );
};
