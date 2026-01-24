import React from 'react';

interface MorphologyLabProps {
    forms: Array<{
        label: string;
        swe: string;
        arb: string;
    }>;
    base: string;
}

export const MorphologyLab: React.FC<MorphologyLabProps> = ({ forms, base }) => (
    <div className="morphology-lab fade-in">
        <h2 className="module-title">Ordets Lab 🧪</h2>
        <div className="morph-table">
            {forms.map((f, i) => (
                <div key={i} className="morph-row">
                    <div className="morph-label">{f.label}</div>
                    <div className="morph-value">{f.swe}</div>
                    <div className="morph-arb" dir="rtl">{f.arb}</div>
                </div>
            ))}
        </div>
        <div className="morph-hint">Observera hur stammen <strong>{base.endsWith('a') ? base.slice(0, -1) : base}</strong> förändras</div>
    </div>
);
