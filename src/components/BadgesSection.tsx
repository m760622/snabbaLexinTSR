import React from 'react';

export interface Badge {
    id: string;
    name: string;
    icon: string;
    description: string;
    requirement: (stats: any) => boolean;
}

const badgeDefinitions: Badge[] = [
    { id: 'b1', name: 'المبتدئ الواعد', icon: '🌱', description: 'أتقن 5 كلمات', requirement: (s) => s.wordsMastered >= 5 },
    { id: 'b2', name: 'شعلة النشاط', icon: '🔥', description: 'سلسلة 3 أيام', requirement: (s) => s.currentStreak >= 3 },
    { id: 'b3', name: 'قاموس بشري', icon: '📚', description: 'أتقن 50 كلمة', requirement: (s) => s.wordsMastered >= 50 },
    { id: 'b4', name: 'بطل النطق', icon: '🎤', description: 'استخدم مختبر النطق', requirement: (s) => s.speechCount >= 10 },
];

export const BadgesSection: React.FC<{ stats: any }> = ({ stats }) => {
    return (
        <div style={styles.container}>
            <h3 style={styles.title}>أوسمة الإنجاز 🏆</h3>
            <div style={styles.grid}>
                {badgeDefinitions.map(badge => {
                    const isUnlocked = badge.requirement(stats);
                    return (
                        <div key={badge.id} style={{
                            ...styles.badgeCard,
                            opacity: isUnlocked ? 1 : 0.4,
                            borderColor: isUnlocked ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)'
                        }}>
                            <div style={{
                                ...styles.iconWrapper,
                                textShadow: isUnlocked ? '0 0 15px rgba(255,215,0,0.6)' : 'none'
                            }}>
                                <span style={styles.icon}>{badge.icon}</span>
                            </div>
                            <div style={styles.badgeName}>{badge.name}</div>
                            <div style={styles.badgeDesc}>{badge.description}</div>
                            {!isUnlocked && <div style={styles.lockedHint}>🔒 قيد القفل</div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        marginTop: '30px',
        padding: '15px'
    },
    title: {
        fontSize: '1.2rem',
        marginBottom: '20px',
        textAlign: 'center',
        color: '#fff',
        fontWeight: 'bold'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '15px'
    },
    badgeCard: {
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '20px',
        padding: '15px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '140px'
    },
    iconWrapper: {
        fontSize: '2.5rem',
        marginBottom: '10px',
        transition: 'all 0.3s ease'
    },
    badgeName: {
        fontWeight: 'bold',
        fontSize: '0.9rem',
        color: '#fff',
        marginBottom: '4px'
    },
    badgeDesc: {
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.6)',
        lineHeight: '1.4'
    },
    lockedHint: {
        fontSize: '0.7rem',
        marginTop: 'auto',
        paddingTop: '8px',
        color: '#60a5fa',
        fontWeight: '600'
    }
};
