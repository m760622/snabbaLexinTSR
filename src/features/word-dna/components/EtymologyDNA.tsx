import React from 'react';

interface EtymologyDNAProps {
    history: {
        origin: string;
        note: string;
        arabicNote: string;
    };
}

export const EtymologyDNA: React.FC<EtymologyDNAProps> = ({ history }) => (
    <div className="etymology-dna fade-in">
        <h2 className="module-title">Ordets DNA 📜</h2>
        <div className="dna-card">
            <div className="dna-origin">
                <span className="origin-badge">Ursprung</span>
                <span className="origin-text">{history.origin}</span>
            </div>
            <div className="dna-note">
                <p>{history.note}</p>
                <hr className="dna-divider" />
                <p className="dna-arb" dir="rtl">{history.arabicNote}</p>
            </div>
            <div className="dna-icon-bg">🧬</div>
        </div>
    </div>
);
