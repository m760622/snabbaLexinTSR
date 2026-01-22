import { useState, useEffect } from 'react';

interface ProfileData {
    xp: number;
    level: number;
    xpToNextLevel: number;
    xpProgress: number; // 0-100 percentage
    streak: number;
    isStreakActive: boolean;
    masteredWords: number;
    totalWords: number;
    dailyProgress: number;
    dailyGoal: number;
    weeklyActivity: number[];
}

interface UseProfileDataReturn extends ProfileData {
    isLoading: boolean;
    error: string | null;
    refresh: () => void;
}

/**
 * Custom hook to fetch profile data from IndexedDB/localStorage
 */
export function useProfileData(): UseProfileDataReturn {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ProfileData>({
        xp: 0,
        level: 1,
        xpToNextLevel: 100,
        xpProgress: 0,
        streak: 0,
        isStreakActive: false,
        masteredWords: 0,
        totalWords: 0,
        dailyProgress: 0,
        dailyGoal: 10,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0]
    });

    const calculateLevel = (xp: number): { level: number; xpToNext: number; progress: number } => {
        // Level formula: level = floor(sqrt(xp / 100)) + 1
        // XP needed for level n: (n-1)^2 * 100
        const level = Math.floor(Math.sqrt(xp / 100)) + 1;
        const xpForCurrentLevel = (level - 1) ** 2 * 100;
        const xpForNextLevel = level ** 2 * 100;
        const xpInCurrentLevel = xp - xpForCurrentLevel;
        const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
        const progress = (xpInCurrentLevel / xpNeededForNext) * 100;

        return {
            level,
            xpToNext: xpForNextLevel - xp,
            progress: Math.min(progress, 100)
        };
    };

    const checkStreakActive = (lastActivityDate: string | null): boolean => {
        if (!lastActivityDate) return false;
        const last = new Date(lastActivityDate);
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 1;
    };

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get user settings
            const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
            const dailyGoal = settings.dailyGoal || 10;

            // Get XP from localStorage
            const userXP = parseInt(localStorage.getItem('userXP') || '0', 10);
            const { level, xpToNext, progress } = calculateLevel(userXP);

            // Get streak data
            const streakData = JSON.parse(localStorage.getItem('streakData') || '{"count": 0, "lastDate": null}');
            const isActive = checkStreakActive(streakData.lastDate);

            // Get mastered words count from assessments
            const assessments = JSON.parse(localStorage.getItem('wordAssessments') || '{}');
            const masteredCount = Object.values(assessments).filter((v: any) => v.level >= 4).length;
            const totalCount = Object.keys(assessments).length;

            // Get today's progress
            const todayKey = new Date().toISOString().split('T')[0];
            const dailyProgress = parseInt(localStorage.getItem(`daily_${todayKey}`) || '0', 10);

            // Get weekly activity
            const weeklyActivity: number[] = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const key = date.toISOString().split('T')[0];
                weeklyActivity.push(parseInt(localStorage.getItem(`daily_${key}`) || '0', 10));
            }

            setData({
                xp: userXP,
                level,
                xpToNextLevel: xpToNext,
                xpProgress: progress,
                streak: streakData.count || 0,
                isStreakActive: isActive,
                masteredWords: masteredCount,
                totalWords: totalCount,
                dailyProgress,
                dailyGoal,
                weeklyActivity
            });
        } catch (e) {
            console.error('[useProfileData] Error:', e);
            setError('Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Listen for data changes
        const handleStorageChange = () => fetchData();
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('xpUpdated', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('xpUpdated', handleStorageChange);
        };
    }, []);

    return {
        ...data,
        isLoading,
        error,
        refresh: fetchData
    };
}

export default useProfileData;
