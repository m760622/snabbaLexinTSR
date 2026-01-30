
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { lessonsData, ExampleItem } from '../learn/lessonsData';
import { normalizeArabic } from '../utils';
import { SoundManager } from '../utils/SoundManager';
import { Confetti } from '../confetti';

interface QuizViewProps {
    onBack: () => void;
    lessonId?: string | null; // If null, random quiz. If 'review', review mistakes.
}

interface QuizQuestion {
    id: string;
    question: string;
    answer: string;
    options: string[];
    type: 'swe-to-arb' | 'arb-to-swe';
    example: ExampleItem;
}

export const QuizView: React.FC<QuizViewProps> = ({ onBack, lessonId = null }) => {
    // State
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFinished, setIsFinished] = useState(false);

    // Interaction State
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [shakingOption, setShakingOption] = useState<string | null>(null); // For wrong answer animation

    // Sound Manager
    const soundManager = useMemo(() => SoundManager.getInstance(), []);

    // Load Mistakes (from localStorage)
    const getMistakesIds = (): Set<string> => {
        try {
            const saved = localStorage.getItem('learn_mistakes');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    };

    // Track Mistake (Save to localStorage)
    const trackMistake = (example: ExampleItem) => {
        const id = getStableId(example.swe);
        const currentMistakes = getMistakesIds();
        currentMistakes.add(id);
        localStorage.setItem('learn_mistakes', JSON.stringify([...currentMistakes]));
    };

    const clearMistake = (example: ExampleItem) => {
        const id = getStableId(example.swe);
        const currentMistakes = getMistakesIds();
        if (currentMistakes.has(id)) {
            currentMistakes.delete(id);
            localStorage.setItem('learn_mistakes', JSON.stringify([...currentMistakes]));
        }
    };

    const getStableId = (text: string) => text.toLowerCase().trim().replace(/\s+/g, '_');

    // Generate Questions Effect
    useEffect(() => {
        generateQuestions();
    }, [lessonId]);

    const generateQuestions = () => {
        setIsLoading(true);
        // Simulate slight delay for UX
        setTimeout(() => {
            const allExamples: ExampleItem[] = [];
            const mistakes = getMistakesIds();

            // 1. Collect Source Examples
            if (lessonId === 'review') {
                lessonsData.forEach(l => l.sections.forEach(s => s.examples.forEach(ex => {
                    if (!ex.swe || !ex.arb) return;
                    if (mistakes.has(getStableId(ex.swe))) {
                        allExamples.push(ex);
                    }
                })));
            } else {
                const sourceLessons = lessonId
                    ? lessonsData.filter(l => l.id === lessonId)
                    : lessonsData;

                sourceLessons.forEach(l => l.sections.forEach(s => s.examples.forEach(ex => {
                    if (ex.swe && ex.arb) allExamples.push(ex);
                })));
            }

            // 2. Prepare Distractors Pool (Global)
            const globalDistractors: ExampleItem[] = [];
            lessonsData.forEach(l => l.sections.forEach(s => s.examples.forEach(ex => {
                if (ex.swe && ex.arb) globalDistractors.push(ex);
            })));

            // 3. Generate Questions
            const maxQuestions = 10;
            const shuffled = [...allExamples].sort(() => Math.random() - 0.5).slice(0, maxQuestions);

            const newQuestions = shuffled.map(ex => {
                const type = Math.random() < 0.5 ? 'swe-to-arb' : 'arb-to-swe';
                const isSweToArb = type === 'swe-to-arb';

                const questionText = isSweToArb ? ex.swe : ex.arb;
                const answerText = isSweToArb ? ex.arb : ex.swe;

                // Distractors
                const others = globalDistractors.filter(e => e.swe !== ex.swe);
                const uniqueOptions = new Set<string>();
                uniqueOptions.add(answerText);

                while (uniqueOptions.size < 4 && others.length > 0) {
                    const randomEx = others[Math.floor(Math.random() * others.length)];
                    const opt = isSweToArb ? randomEx.arb : randomEx.swe;
                    uniqueOptions.add(opt);
                }

                return {
                    id: getStableId(ex.swe),
                    question: questionText,
                    answer: answerText,
                    options: Array.from(uniqueOptions).sort(() => Math.random() - 0.5),
                    type: type as 'swe-to-arb' | 'arb-to-swe',
                    example: ex
                };
            });

            setQuestions(newQuestions);
            setIsLoading(false);
        }, 500);
    };

    const handleAnswer = (option: string) => {
        if (isAnswered) return; // Prevent double click

        const q = questions[currentIndex];
        const isCorrect = option === q.answer;

        setSelectedOption(option);
        setIsAnswered(true);

        if (isCorrect) {
            soundManager.play('correct');
            setScore(s => s + 1);
            setStreak(s => s + 1);
            clearMistake(q.example);

            if (streak >= 2) soundManager.play('streak'); // Streak check (using old state so >=2 becomes >=3 next render technically, simplified)
        } else {
            soundManager.play('wrong');
            setShakingOption(option);
            setStreak(0);
            trackMistake(q.example);
            if (navigator.vibrate) navigator.vibrate(200);
        }

        // Wait then next
        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setIsAnswered(false);
                setSelectedOption(null);
                setShakingOption(null);
            } else {
                finishQuiz();
            }
        }, 1500);
    };

    const finishQuiz = () => {
        setIsFinished(true);
        const percentage = ((score + (selectedOption === questions[currentIndex].answer ? 1 : 0)) / questions.length) * 100;
        if (percentage >= 70) {
            soundManager.play('win');
            Confetti.burst();
        }
    };

    const handleRetry = () => {
        setQuestions([]);
        setScore(0);
        setStreak(0);
        setCurrentIndex(0);
        setIsFinished(false);
        setIsAnswered(false);
        setSelectedOption(null);
        generateQuestions();
    };

    if (isLoading) {
        return <div className="text-center p-10 pt-20">Laddar quiz... <div className="spinner mt-4"></div></div>;
    }

    if (questions.length === 0) {
        return (
            <div className="text-center p-10 pt-20">
                <h2 className="text-xl mb-4">Inga frågor hittades</h2>
                <p className="text-muted mb-6">Det finns inga frågor tillgängliga för detta urval.</p>
                <button onClick={onBack} className="primary-btn">Tillbaka</button>
            </div>
        );
    }

    if (isFinished) {
        const finalScore = score; // State update might lag last one, but let's assume simple
        const passed = finalScore >= (questions.length * 0.7);

        return (
            <div className="quiz-results-card text-center p-8 animate-fade-in bg-surface rounded-2xl border border-white/10 m-4 mt-20">
                <div className="text-6xl mb-4">{passed ? '🎉' : '💪'}</div>
                <h2 className="text-2xl font-bold mb-2">{passed ? 'Fantastiskt!' : 'Bra kämpat!'}</h2>
                <div className="text-4xl font-bold my-4 text-accent">{finalScore}<span className="text-xl text-muted">/{questions.length}</span></div>
                <p className="mb-8 text-muted">{passed ? 'Du klarade det galant!' : 'Övning ger färdighet. Försök igen!'}</p>

                <div className="flex flex-col gap-3">
                    <button onClick={handleRetry} className="primary-btn w-full justify-center">Spela igen</button>
                    <button onClick={onBack} className="secondary-btn w-full justify-center">Avsluta</button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentIndex];
    const progress = ((currentIndex) / questions.length) * 100;

    return (
        <div className="quiz-view w-full h-full px-4" style={{ paddingTop: '60px' }}>
            {/* Header Stats */}
            <div className="flex justify-between items-center mb-6 bg-surface p-3 rounded-xl border border-white/5 shadow-lg">
                <div className="flex flex-col w-full">
                    <div className="flex justify-between text-sm mb-2 px-1">
                        <span>📝 {currentIndex + 1}/{questions.length}</span>
                        <div className={`flex items-center gap-1 ${streak > 2 ? 'text-orange-500 font-bold' : ''}`}>
                            <span>🔥</span> {streak}
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="bg-accent h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Question Card */}
            <div className="question-card bg-surface glass-card p-8 rounded-2xl text-center mb-6 min-h-[160px] flex items-center justify-center border border-accent/20 shadow-[0_0_30px_rgba(0,243,255,0.05)]">
                <h2 className="text-2xl font-bold md:text-3xl leading-relaxed" dir={currentQ.type === 'arb-to-swe' ? 'rtl' : 'ltr'}>
                    {currentQ.question}
                </h2>
            </div>

            {/* Options Grid */}
            <div className="quiz-options">
                {currentQ.options.map((opt, idx) => {
                    let stateClass = '';
                    if (isAnswered) {
                        if (opt === currentQ.answer) stateClass = 'correct-answer';
                        else if (opt === selectedOption && opt !== currentQ.answer) stateClass = 'wrong-answer';
                        else stateClass = 'opacity-50 grayscale';
                    } else {
                        stateClass = '';
                    }

                    const isShaking = shakingOption === opt;

                    return (
                        <button
                            key={idx}
                            onClick={() => handleAnswer(opt)}
                            disabled={isAnswered}
                            className={`
                                option-btn w-full text-left
                                ${isAnswered ? '' : 'hover:scale-[0.98]'}
                                ${stateClass}
                                ${isShaking ? 'animate-shake' : ''}
                            `}
                            dir={currentQ.type === 'swe-to-arb' ? 'rtl' : 'ltr'}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
