import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import TrainingView from '../src/components/TrainingView';
import * as useTrainingWordsHook from '../src/hooks/useTrainingWords';

// Mock the hook
vi.mock('../src/hooks/useTrainingWords');

describe('TrainingView', () => {
    // Default mock implementation
    const defaultMock = {
        isLoading: false,
        error: null,
        currentWord: null,
        remainingCount: 0,
        masteredCount: 0,
        markAsMastered: vi.fn(),
        nextWord: vi.fn(),
        prevWord: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows loading state initially', () => {
        vi.spyOn(useTrainingWordsHook, 'useTrainingWords').mockReturnValue({
            ...defaultMock,
            isLoading: true,
        } as any);

        render(<TrainingView />);
        expect(screen.getByText(/Laddar träningsord/i)).toBeInTheDocument();
    });

    it('shows error state when error is present', () => {
        const errorMessage = 'Something went wrong';
        vi.spyOn(useTrainingWordsHook, 'useTrainingWords').mockReturnValue({
            ...defaultMock,
            error: errorMessage,
        } as any);

        render(<TrainingView />);
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
        expect(screen.getByText(/Tillbaka/i)).toBeInTheDocument();
    });

    it('shows completion screen when no current word and not loading', () => {
        vi.spyOn(useTrainingWordsHook, 'useTrainingWords').mockReturnValue({
            ...defaultMock,
            isLoading: false,
            currentWord: null,
            masteredCount: 5,
        } as any);

        render(<TrainingView />);
        expect(screen.getByText(/Bra jobbat!/i)).toBeInTheDocument();
        expect(screen.getByText(/Du har lärt dig 5 ord/i)).toBeInTheDocument();
    });

    it('renders active flashcard with swedish word initially', () => {
        const mockWord = {
            id: '1',
            swedish: 'Bok',
            arabic: 'كتاب',
            type: 'substantiv'
        };

        vi.spyOn(useTrainingWordsHook, 'useTrainingWords').mockReturnValue({
            ...defaultMock,
            isLoading: false,
            currentWord: mockWord,
            remainingCount: 1,
        } as any);

        render(<TrainingView />);

        // Swedish word (front) should be visible
        expect(screen.getByRole('heading', { level: 2, name: 'Bok' })).toBeInTheDocument();
        // Arabic word (back) is in DOM but potentially hidden by CSS, but strictly in React tree it is present.
        // We can check if the card is NOT flipped by checking class
        const card = screen.getByText('Bok').closest('.training-card');
        expect(card).not.toHaveClass('flipped');
    });

    it('flips card on click', async () => {
        const mockWord = {
            id: '1',
            swedish: 'Bok',
            arabic: 'كتاب'
        };

        vi.spyOn(useTrainingWordsHook, 'useTrainingWords').mockReturnValue({
            ...defaultMock,
            currentWord: mockWord,
        } as any);

        render(<TrainingView />);

        const card = screen.getByText('Bok').closest('.training-card');
        expect(card).not.toHaveClass('flipped');

        fireEvent.click(card!);

        // Expect class to change
        expect(card).toHaveClass('flipped');
    });

    it('calls nextWord when "Hoppa över" is clicked', () => {
        const nextWordMock = vi.fn();
        vi.spyOn(useTrainingWordsHook, 'useTrainingWords').mockReturnValue({
            ...defaultMock,
            currentWord: { id: '1', swedish: 'test', arabic: 'test' },
            nextWord: nextWordMock,
        } as any);

        render(<TrainingView />);

        const skipBtn = screen.getByText(/Hoppa över/i).closest('button');
        fireEvent.click(skipBtn!);

        expect(nextWordMock).toHaveBeenCalled();
    });

    it('calls markAsMastered when "Klarad" is clicked', async () => {
        const markAsMasteredMock = vi.fn();
        vi.spyOn(useTrainingWordsHook, 'useTrainingWords').mockReturnValue({
            ...defaultMock,
            currentWord: { id: '1', swedish: 'test', arabic: 'test' },
            markAsMastered: markAsMasteredMock,
        } as any);

        render(<TrainingView />);

        const masteredBtn = screen.getByText(/Klarad!/i).closest('button');
        fireEvent.click(masteredBtn!);

        // The component has a delay of 400ms for animation
        // We need to wait for it
        await waitFor(() => {
            expect(markAsMasteredMock).toHaveBeenCalledWith('1');
        }, { timeout: 1000 });
    });
});
