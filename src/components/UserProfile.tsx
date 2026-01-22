import React from 'react';
import CircularProgress from './CircularProgress';
import StreakCounter from './StreakCounter';
import DailyGoalBar from './DailyGoalBar';
import { useProfileData } from '../hooks/useProfileData';

/**
 * UserProfile - Main Profile Dashboard Component
 * Displays user stats, XP progress, streak, and daily goals
 */
const UserProfile: React.FC = () => {
    const {
        xp,
        level,
        xpProgress,
        xpToNextLevel,
        streak,
        isStreakActive,
        masteredWords,
        dailyProgress,
        dailyGoal,
        weeklyActivity,
        isLoading
    } = useProfileData();

    if (isLoading) {
        return (
            <div className="profile-loading">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Level names
    const getLevelName = (lvl: number): { sv: string; ar: string } => {
        if (lvl <= 2) return { sv: 'Nybörjare', ar: 'مبتدئ' };
        if (lvl <= 5) return { sv: 'Elev', ar: 'طالب' };
        if (lvl <= 10) return { sv: 'Avancerad', ar: 'متقدم' };
        if (lvl <= 20) return { sv: 'Expert', ar: 'خبير' };
        return { sv: 'Mästare', ar: 'ماهر' };
    };

    const levelName = getLevelName(level);
    const weekDays = {
        sv: ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'],
        ar: ['اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت', 'أحد']
    };
    const maxActivity = Math.max(...weeklyActivity, 1);

    return (
        <div className="profile-dashboard">
            {/* Profile Hero with XP Ring */}
            <div className="profile-hero-react">
                <CircularProgress
                    progress={xpProgress}
                    size={140}
                    strokeWidth={10}
                    color="var(--aurora-1, #2dd4bf)"
                >
                    <div className="xp-center">
                        <span className="xp-level">{level}</span>
                        <span className="xp-label">
                            <span className="sv-text">Nivå</span>
                            <span className="ar-text">مستوى</span>
                        </span>
                    </div>
                </CircularProgress>

                <div className="profile-info">
                    <h2 className="profile-name">
                        <span className="sv-text">Inlärare</span>
                        <span className="ar-text">المتعلم</span>
                    </h2>
                    <div className="level-badge">
                        🌟 <span className="sv-text">{levelName.sv}</span>
                        <span className="ar-text">{levelName.ar}</span>
                    </div>
                    <div className="xp-info">
                        <span className="xp-current">{xp} XP</span>
                        <span className="xp-next">• {xpToNextLevel} till nästa</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid-react">
                <StreakCounter days={streak} isActive={isStreakActive} />

                <div className="stat-card-react">
                    <div className="stat-value">{masteredWords}</div>
                    <div className="stat-label">
                        📖 <span className="sv-text">Ord</span>
                        <span className="ar-text">كلمات</span>
                    </div>
                </div>

                <div className="stat-card-react">
                    <div className="stat-value">{xp}</div>
                    <div className="stat-label">⭐ XP</div>
                </div>
            </div>

            {/* Daily Goal */}
            <div className="section-card-react">
                <DailyGoalBar current={dailyProgress} target={dailyGoal} />
            </div>

            {/* Weekly Activity Chart */}
            <div className="section-card-react">
                <h3 className="section-title-react">
                    📈 <span className="sv-text">Veckoaktivitet</span>
                    <span className="ar-text">نشاط الأسبوع</span>
                </h3>
                <div className="weekly-chart-react">
                    {weeklyActivity.map((activity, index) => (
                        <div key={index} className="chart-bar-container">
                            <div
                                className="chart-bar"
                                style={{ height: `${(activity / maxActivity) * 100}%` }}
                            />
                            <span className="chart-label">
                                <span className="sv-text">{weekDays.sv[index]}</span>
                                <span className="ar-text">{weekDays.ar[index]}</span>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
