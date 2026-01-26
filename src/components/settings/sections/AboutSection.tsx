import React from 'react';
import { SettingsSection } from '../SettingsSection';

export const AboutSection: React.FC = () => {
    return (
        <SettingsSection
            id="about"
            titleSv="Om SnabbaLexin"
            titleAr="حول التطبيق"
            icon="ℹ️"
            iconGradient="gradient-rose"
        >
            {/* Version */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">📱</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Version</span>
                            <span className="ar-text">الإصدار</span>
                        </span>
                    </div>
                </div>
                <span className="version-badge">v3.2.0</span>
            </div>

            {/* Changelog */}
            <a href="changelog.html" className="settings-item clickable" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="item-left">
                    <span className="item-icon">📋</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Ändringslogg</span>
                            <span className="ar-text">سجل التغييرات</span>
                        </span>
                    </div>
                </div>
                <svg className="item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </a>

            {/* Device Info */}
            <a href="device.html" className="settings-item clickable" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="item-left">
                    <span className="item-icon">🖥️</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Enhetsinformation</span>
                            <span className="ar-text">معلومات الجهاز</span>
                        </span>
                    </div>
                </div>
                <svg className="item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </a>

            {/* Vocabulary Count */}
            <div className="settings-item">
                <div className="item-left">
                    <span className="item-icon">📖</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Ordförråd</span>
                            <span className="ar-text">حجم القاموس</span>
                        </span>
                    </div>
                </div>
                <span className="info-badge">+34,000</span>
            </div>

            {/* Copyright */}
            <div className="copyright-info">
                <p>SnabbaLexin © 2025</p>
                <p>
                    <span className="sv-text">Made with ❤️ for language learners</span>
                    <span className="ar-text">صنع بحب ❤️ لمتعلمي اللغات</span>
                </p>
            </div>
        </SettingsSection>
    );
};
