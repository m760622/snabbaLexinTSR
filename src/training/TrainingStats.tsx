/**
 * Training Statistics Component
 * Shows streak, accuracy, and progress chart
 */
import React, { useState, useEffect } from 'react';
import { DictionaryDB } from '../db';

interface TrainingSession {
    date: string;
    wordsReviewed: number;
    correctCount: number;
    timeSpentMs: number;
}

interface StatsData {
    currentStreak: number;
    totalWords: number;
    accuracy: number;
    todayWords: number;
    last7Days: { date: string; count: number }[];
}

const TrainingStats: React.FC = () => {
    const [stats, setStats] = useState<StatsData | null>(null);

    useEffect(() => {
        calculateStats();
    }, []);

    const calculateStats = async () => {
        const sessions: TrainingSession[] = DictionaryDB.getTrainingSessions();

        // Group by date
        const byDate = new Map<string, { words: number; correct: number }>();
        sessions.forEach(s => {
            const existing = byDate.get(s.date) || { words: 0, correct: 0 };
            byDate.set(s.date, {
                words: existing.words + s.wordsReviewed,
                correct: existing.correct + s.correctCount
            });
        });

        // Calculate streak
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let checkDate = new Date();

        while (true) {
            const dateStr = checkDate.toISOString().split('T')[0];
            if (byDate.has(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else if (dateStr !== today) {
                break;
            } else {
                checkDate.setDate(checkDate.getDate() - 1);
            }
        }

        // Calculate totals
        let totalWords = 0;
        let totalCorrect = 0;
        byDate.forEach(v => {
            totalWords += v.words;
            totalCorrect += v.correct;
        });

        // Last 7 days
        const last7Days: { date: string; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayData = byDate.get(dateStr);
            last7Days.push({
                date: d.toLocaleDateString('sv', { weekday: 'short' }),
                count: dayData?.words || 0
            });
        }

        // Today's words
        const todayData = byDate.get(today);

        setStats({
            currentStreak: streak,
            totalWords,
            accuracy: totalWords > 0 ? Math.round((totalCorrect / totalWords) * 100) : 0,
            todayWords: todayData?.words || 0,
            last7Days
        });
    };

    if (!stats) {
        return <div className="stats-loading">Laddar statistik...</div>;
    }

    const maxCount = Math.max(...stats.last7Days.map(d => d.count), 1);

    return (
        <div className="training-stats">
            {/* Stats Row */}
            <div className="stats-row">
                <div className="stat-card streak">
                    <span className="stat-icon">🔥</span>
                    <span className="stat-number">{stats.currentStreak}</span>
                    <span className="stat-text">dagars rad</span>
                </div>
                <div className="stat-card accuracy">
                    <span className="stat-icon">🎯</span>
                    <span className="stat-number">{stats.accuracy}%</span>
                    <span className="stat-text">precision</span>
                </div>
                <div className="stat-card today">
                    <span className="stat-icon">📚</span>
                    <span className="stat-number">{stats.todayWords}</span>
                    <span className="stat-text">idag</span>
                </div>
            </div>

            {/* Mini Chart */}
            <div className="mini-chart">
                <div className="chart-title">Senaste 7 dagarna</div>
                <div className="chart-bars">
                    {stats.last7Days.map((day, i) => (
                        <div key={i} className="chart-bar-container">
                            <div
                                className="chart-bar"
                                style={{ height: `${(day.count / maxCount) * 100}%` }}
                            >
                                {day.count > 0 && (
                                    <span className="bar-value">{day.count}</span>
                                )}
                            </div>
                            <span className="bar-label">{day.date}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrainingStats;
