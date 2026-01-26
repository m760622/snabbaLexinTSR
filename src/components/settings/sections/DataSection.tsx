import React, { useRef, useEffect, useState } from 'react';
import { SettingsSection } from '../SettingsSection';
import { useSettings } from '../../../hooks/useSettings';

export const DataSection: React.FC = () => {
    const { settings, clearData, resetSettings } = useSettings();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [storageUsed, setStorageUsed] = useState<{ kb: string, percent: number }>({ kb: '0', percent: 0 });

    useEffect(() => {
        calculateStorage();
    }, [settings]); // Recalculate when settings change

    const calculateStorage = () => {
        let totalSize = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                totalSize += localStorage[key].length * 2; // UTF-16
            }
        }
        const sizeKB = (totalSize / 1024).toFixed(1);
        const maxKB = 5000; // ~5MB limit
        const percentage = Math.min(100, (totalSize / 1024 / maxKB) * 100);
        setStorageUsed({ kb: sizeKB, percent: percentage });
    };

    const handleExport = () => {
        const data = {
            favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
            progress: JSON.parse(localStorage.getItem('userProgress') || '{}'),
            settings: JSON.parse(localStorage.getItem('userSettings') || '{}'),
            exportDate: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snabbalexin-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    if (data.favorites) localStorage.setItem('favorites', JSON.stringify(data.favorites));
                    if (data.progress) localStorage.setItem('userProgress', JSON.stringify(data.progress));
                    // Check logic for settings if needed, but usually we just prompt reload or sync
                    alert('Data importerad! Sidan laddas om... / تم استيراد البيانات! سيتم إعادة التحميل...');
                    location.reload();
                } catch (err) {
                    alert('Fel vid import / خطأ في الاستيراد');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleClearFavorites = () => {
        if (confirm('Rensa favoriter? / مسح المفضلة؟')) {
            clearData('favorites');
            calculateStorage();
        }
    };

    const handleClearAll = () => {
        if (confirm('Rensa ALL data? / مسح جميع البيانات؟')) {
            clearData('all');
        }
    };

    return (
        <SettingsSection
            id="data"
            titleSv="Data & Sekretess"
            titleAr="البيانات والخصوصية"
            icon="💾"
            iconGradient="gradient-cyan"
        >
            {/* Export */}
            <div className="settings-item clickable" onClick={handleExport} style={{ cursor: 'pointer' }}>
                <div className="item-left">
                    <span className="item-icon">📤</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Exportera data</span>
                            <span className="ar-text">تصدير البيانات</span>
                        </span>
                    </div>
                </div>
                <svg className="item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </div>

            {/* Import */}
            <div className="settings-item clickable" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                <div className="item-left">
                    <span className="item-icon">📥</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Importera data</span>
                            <span className="ar-text">استيراد البيانات</span>
                        </span>
                    </div>
                </div>
                <svg className="item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                style={{ display: 'none' }}
                onChange={handleImport}
            />

            {/* Clear Favorites */}
            <div className="settings-item clickable danger" onClick={handleClearFavorites} style={{ cursor: 'pointer' }}>
                <div className="item-left">
                    <span className="item-icon">🗑️</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Rensa favoriter</span>
                            <span className="ar-text">مسح المفضلة</span>
                        </span>
                    </div>
                </div>
                <svg className="item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </div>

            {/* Clear All Data */}
            <div className="settings-item clickable danger" onClick={handleClearAll} style={{ cursor: 'pointer' }}>
                <div className="item-left">
                    <span className="item-icon">⚠️</span>
                    <div className="item-info">
                        <span className="item-name">
                            <span className="sv-text">Rensa all data</span>
                            <span className="ar-text">مسح جميع البيانات</span>
                        </span>
                    </div>
                </div>
                <svg className="item-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </div>

            {/* Storage Info */}
            <div className="storage-info">
                <div className="storage-header">
                    <span>
                        <span className="sv-text">Använt lagringsutrymme</span>
                        <span className="ar-text">المساحة المستخدمة</span>
                    </span>
                    <span>{storageUsed.kb} KB</span>
                </div>
                <div className="storage-bar-bg">
                    <div className="storage-bar-fill" style={{ width: `${storageUsed.percent}%` }}></div>
                </div>
            </div>
        </SettingsSection>
    );
};
