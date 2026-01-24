import React, { useState, useEffect } from 'react';

interface QuizOptionsProps {
    correctAnswer: string;
    onAnswer: (isCorrect: boolean) => void;
    state: 'unanswered' | 'correct' | 'wrong';
}

export const QuizOptions: React.FC<QuizOptionsProps> = ({ correctAnswer, onAnswer, state }) => {
    const [options, setOptions] = useState<string[]>([]);
    const [selected, setSelected] = useState<string | null>(null);

    useEffect(() => {
        const distractors = ['سعيد', 'كبير', 'بيت', 'سيارة', 'شجرة', 'جميل', 'سريع', 'بسيط', 'مهم'];
        let choices = [correctAnswer];
        while (choices.length < 3) {
            const d = distractors[Math.floor(Math.random() * distractors.length)];
            if (!choices.includes(d)) choices.push(d);
        }
        setOptions(choices.sort(() => Math.random() - 0.5));
        setSelected(null);
    }, [correctAnswer]);

    return (
        <div className="quiz-options-container">
            {options.map((opt, i) => {
                const isCorrect = opt === correctAnswer;
                const isWrong = state === 'wrong' && opt === selected;
                return (
                    <button
                        key={i}
                        className={`quiz-option ${state === 'correct' && isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
                        onClick={() => {
                            setSelected(opt);
                            onAnswer(isCorrect);
                        }}
                        disabled={state !== 'unanswered'}
                    >
                        {opt}
                    </button>
                );
            })}
        </div>
    );
};
