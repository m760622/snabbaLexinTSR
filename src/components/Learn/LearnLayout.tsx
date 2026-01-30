import React, { useEffect, useState } from 'react';
import { LearnHeader } from './LearnHeader';
import { QuickAccessRow } from './QuickAccessRow';
import { MobileDock } from './MobileDock';
import { BrowseView } from '../../views/BrowseView';
import { FlashcardView } from '../../views/FlashcardView';
import { QuizView } from '../../views/QuizView';
import { LessonDetailView } from '../../views/LessonDetailView';
import { useLearnState } from '../../hooks/useLearnState';

/**
 * LearnLayout
 * Main shell for the Learn Screen.
 */
export const LearnLayout: React.FC = () => {
    // Internal loading state (visual only)
    const [isLoading, setIsLoading] = useState(true);

    // Global Learn State
    const { state, actions } = useLearnState();
    const { activeMode, selectedLessonId, activeFilter, searchQuery, isFilterOpen, completedLessons } = state;
    const { setMode, navigateToLesson, navigateBack, setFilter, setSearch, toggleFilter } = actions;

    // Load Initial State
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <div className="loading-screen">Laddar...</div>; // Simple loader
    }

    return (
        <div className="learn-layout w-full min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] padding-bottom-dock">
            <LearnHeader
                onBack={activeMode !== 'browse' ? navigateBack : undefined}
            />

            <main className="pt-0 pb-32 px-4 max-w-md mx-auto">
                {/* Quick Access (Only show in browse mode) */}
                {activeMode === 'browse' && (
                    <QuickAccessRow onQuickAction={(action) => {
                        if (action === 'quiz') setMode('quiz');
                        if (action === 'flashcards') setMode('flashcard');
                    }} />
                )}

                {/* Mode: Browse View */}
                {activeMode === 'browse' && (
                    <BrowseView
                        onNavigate={navigateToLesson}
                        activeFilter={activeFilter}
                        onFilterChange={setFilter}
                        searchQuery={searchQuery}
                        onSearchChange={setSearch}
                        isFilterOpen={isFilterOpen}
                        onToggleFilter={toggleFilter}
                        completedLessons={completedLessons}
                    />
                )}

                {/* Mode: Flashcard View */}
                {activeMode === 'flashcard' && <FlashcardView onBack={navigateBack} />}

                {/* Mode: Quiz View */}
                {activeMode === 'quiz' && (
                    <QuizView
                        lessonId={selectedLessonId}
                        onBack={navigateBack}
                    />
                )}

                {/* Mode: Lesson Details */}
                {activeMode === 'lesson' && selectedLessonId && (
                    <LessonDetailView
                        lessonId={selectedLessonId}
                        onStartQuiz={() => setMode('quiz')}
                    />
                )}

                {/* Mode: Saved (Placeholder) */}
                {activeMode === 'saved' && (
                    <div className="text-center p-10">
                        <h2 className="text-xl">Sparade Lektioner</h2>
                        <p className="text-muted">Kommer snart...</p>
                        <button className="primary-btn mt-4" onClick={() => setMode('browse')}>Tillbaka</button>
                    </div>
                )}
            </main>

            {/* Navigation (Mobile Dock) */}
            <MobileDock activeMode={activeMode} onModeChange={setMode} />
        </div>
    );
};
