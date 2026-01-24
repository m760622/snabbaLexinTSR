import React from 'react';

interface SemanticMapProps {
    related: Array<{
        word: string;
        type: 'synonym' | 'antonym' | 'related';
        arb: string;
    }>;
}

export const SemanticMap: React.FC<SemanticMapProps> = ({ related }) => (
    <div className="semantic-map-view fade-in">
        <h2 className="module-title">Ordets Karta ☁️</h2>
        <div className="bubble-container">
            {related.map((item, i) => (
                <div key={i} className={`bubble-item ${item.type}`} style={{
                    '--delay': `${i * 0.1}s`,
                    '--x': i === 0 ? '-60px' : (i === 1 ? '70px' : (i === 2 ? '-50px' : '60px')),
                    '--y': i === 0 ? '-50px' : (i === 1 ? '-40px' : (i === 2 ? '60px' : '50px'))
                } as any}>
                    <div className="bubble-type">{item.type}</div>
                    <div className="bubble-word">{item.word}</div>
                    <div className="bubble-arb" dir="rtl">{item.arb}</div>
                </div>
            ))}
            <div className="center-pulse"></div>
        </div>
    </div>
);
