
import React from 'react';
import { LessonCard } from './LessonCard';
import type { Lesson } from '../../learn/lessonsData';

interface LessonListProps {
    lessons: Lesson[];
    completedLessons: Set<string>;
    onLessonSelect: (lessonId: string) => void;
    isLoading?: boolean;
}

export const LessonList: React.FC<LessonListProps> = ({ lessons, completedLessons, onLessonSelect, isLoading }) => {
    if (isLoading) {
        return (
            <div className="lessons-grid-loading">
                <div className="spinner"></div>
                <p>Laddar lektioner...</p>
            </div>
        );
    }

    if (lessons.length === 0) {
        return (
            <div className="empty-state">
                <p>Inga lektioner hittades.</p>
                <p className="ar-text">لم يتم العثور على دروس.</p>
            </div>
        );
    }

    return (
        <div id="lessonsGrid" className="lessons-grid">
            {lessons.map(lesson => (
                <LessonCard
                    key={lesson.id}
                    lesson={lesson}
                    isCompleted={completedLessons.has(lesson.id)}
                    onClick={onLessonSelect}
                />
            ))}
            {/* Sentinel for infinite scroll could go here */}
            {/* <div id="lessons-sentinel" style={{ height: '50px', width: '100%' }}></div> */}
        </div>
    );
};
