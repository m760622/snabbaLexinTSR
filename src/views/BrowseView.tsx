
import React, { useMemo, useState } from 'react';
import { FilterBar } from '../components/Learn/FilterBar';
import { LessonList } from '../components/Learn/LessonList';
import { lessonsData } from '../learn/lessonsData';
import { normalizeArabic } from '../utils';

export interface BrowseViewProps {
    // Navigation
    onNavigate: (lessonId: string) => void;

    // Filter & Search State (Controlled)
    activeFilter: 'all' | 'beginner' | 'intermediate' | 'advanced';
    onFilterChange: (filter: 'all' | 'beginner' | 'intermediate' | 'advanced') => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    isFilterOpen: boolean;
    onToggleFilter: () => void;

    // Data
    completedLessons: Set<string>;
}

export const BrowseView: React.FC<BrowseViewProps> = ({
    onNavigate,
    activeFilter,
    onFilterChange,
    searchQuery,
    onSearchChange,
    isFilterOpen,
    onToggleFilter,
    completedLessons
}) => {
    // Derived State (filtering)
    const filteredLessons = useMemo(() => {
        let result = lessonsData;

        if (activeFilter !== 'all') {
            result = result.filter(l => l.level === activeFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase().trim();
            const cleanQuery = normalizeArabic(query);
            result = result.filter(l => {
                if (l.title.toLowerCase().includes(query) || l.id.toLowerCase().includes(query)) return true;
                return l.sections.some(section => {
                    if (section.title.toLowerCase().includes(query)) return true;
                    return section.examples.some(ex =>
                        ex.swe.toLowerCase().includes(query) || normalizeArabic(ex.arb).includes(cleanQuery)
                    );
                });
            });
        }
        return result;
    }, [activeFilter, searchQuery]);

    // Handle Lesson Click
    const handleLessonSelect = (id: string) => {
        if (onNavigate) {
            onNavigate(id);
        }
    };

    return (
        <div id="browseView" className="view-section active fade-in">
            <div className="search-filter-section">
                <div className="search-container">
                    <input
                        type="text"
                        id="lessonSearchInput"
                        placeholder="Sök lektioner / ابحث عن درس..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    <button
                        type="button"
                        className={`filter-toggle-btn ${isFilterOpen ? 'active' : ''}`}
                        aria-label="Toggle Filters"
                        onClick={onToggleFilter}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                        </svg>
                    </button>
                </div>
                <div className={`filter-bar-wrapper ${isFilterOpen ? 'expanded' : 'collapsed'}`} style={{
                    height: isFilterOpen ? 'auto' : '0',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    opacity: isFilterOpen ? 1 : 0
                }}>
                    <FilterBar activeFilter={activeFilter} onFilterChange={onFilterChange} />
                </div>
            </div>

            <LessonList
                lessons={filteredLessons}
                completedLessons={completedLessons}
                onLessonSelect={handleLessonSelect}
                isLoading={false}
            />
        </div>
    );
};
