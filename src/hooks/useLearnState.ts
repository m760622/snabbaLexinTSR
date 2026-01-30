import { useState, useEffect } from 'react';
import { ViewMode } from '../components/Learn/MobileDock';

export interface LearnState {
    activeMode: ViewMode;
    selectedLessonId: string | null;
    activeFilter: 'all' | 'beginner' | 'intermediate' | 'advanced';
    searchQuery: string;
    isFilterOpen: boolean;
    completedLessons: Set<string>;
}

export interface LearnActions {
    navigateToLesson: (id: string) => void;
    navigateBack: () => void;
    setMode: (mode: ViewMode) => void;
    setFilter: (filter: 'all' | 'beginner' | 'intermediate' | 'advanced') => void;
    setSearch: (query: string) => void;
    toggleFilter: () => void;
    markLessonComplete: (id: string) => void;
}

export const useLearnState = () => {
    // Navigation State
    const [activeMode, setActiveMode] = useState<ViewMode>('browse');
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

    // UI/Filter State
    const [activeFilter, setActiveFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(true);

    // Data State
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

    // Load completed lessons on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('learn_completed');
            if (saved) {
                setCompletedLessons(new Set(JSON.parse(saved)));
            }
        } catch (e) {
            console.error('Failed to load completed lessons', e);
        }
    }, []);

    // Actions
    const navigateToLesson = (id: string) => {
        setSelectedLessonId(id);
        setActiveMode('lesson');
    };

    const navigateBack = () => {
        if (activeMode === 'lesson' || activeMode === 'quiz') {
            setActiveMode('browse');
            setSelectedLessonId(null);
        } else {
            // Default fallback
            setActiveMode('browse');
        }
    };

    const setMode = (mode: ViewMode) => {
        setActiveMode(mode);
        if (mode === 'browse') {
            setSelectedLessonId(null);
        }
    };

    const toggleFilter = () => {
        setIsFilterOpen(prev => !prev);
    };

    const markLessonComplete = (id: string) => {
        const newSet = new Set(completedLessons);
        newSet.add(id);
        setCompletedLessons(newSet);
        localStorage.setItem('learn_completed', JSON.stringify(Array.from(newSet)));
    };

    return {
        state: {
            activeMode,
            selectedLessonId,
            activeFilter,
            searchQuery,
            isFilterOpen,
            completedLessons
        },
        actions: {
            navigateToLesson,
            navigateBack,
            setMode,
            setFilter: setActiveFilter,
            setSearch: setSearchQuery,
            toggleFilter,
            markLessonComplete
        }
    };
};
