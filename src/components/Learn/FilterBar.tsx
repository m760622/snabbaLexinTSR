
import React from 'react';

type FilterType = 'all' | 'beginner' | 'intermediate' | 'advanced';

interface FilterBarProps {
    activeFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ activeFilter, onFilterChange }) => {
    return (
        <div className="filter-scroll-container">
            <button
                type="button"
                className={`filter-chip ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => onFilterChange('all')}
            >
                <span className="sv-text">Alla</span>
                <span className="ar-text">الكل</span>
            </button>

            <button
                type="button"
                className={`filter-chip filter-beginner ${activeFilter === 'beginner' ? 'active' : ''}`}
                onClick={() => onFilterChange('beginner')}
            >
                <span className="sv-text">Nybörjare</span>
                <span className="ar-text">مبتدئ</span>
            </button>

            <button
                type="button"
                className={`filter-chip filter-intermediate ${activeFilter === 'intermediate' ? 'active' : ''}`}
                onClick={() => onFilterChange('intermediate')}
            >
                <span className="sv-text">Medel</span>
                <span className="ar-text">متوسط</span>
            </button>

            <button
                type="button"
                className={`filter-chip filter-advanced ${activeFilter === 'advanced' ? 'active' : ''}`}
                onClick={() => onFilterChange('advanced')}
            >
                <span className="sv-text">Avancerad</span>
                <span className="ar-text">متقدم</span>
            </button>
        </div>
    );
};
