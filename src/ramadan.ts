/**
 * Ramadan Module (SnabbaLexin)
 * Handles Countdown, Daily Dua, and Tracking
 */

// Basic interface for Dua
interface DailyDua {
    day: number;
    arabic: string;
    translation: string;
    english: string;
}

// Minimal data for demo (Expand later)
const duas: DailyDua[] = [
    {
        day: 1,
        arabic: "اللَّهُمَّ اجْعَلْ صِيَامِي فِيهِ صِيَامَ الصَّائِمِينَ وَ قِيَامِي فِيهِ قِيَامَ الْقَائِمِينَ",
        translation: "O Allah, let my fasting in this month be the fasting of those who fast sincerely, and my standing up in prayer be the standing of those who pray obediently.",
        english: ""
    }
];

class RamadanManager {
    constructor() {
        this.initCountdown();
        this.loadDailyDua();
        this.initTracker();
    }

    private initCountdown() {
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');

        if (!hoursEl || !minutesEl || !secondsEl) return;

        // Target: Next Midnight (Just for demo) or actual Iftar API
        const targetTime = new Date();
        targetTime.setHours(18, 0, 0, 0); // 6:00 PM Demo
        if (new Date() > targetTime) {
            targetTime.setDate(targetTime.getDate() + 1);
        }

        const update = () => {
            const now = new Date();
            const diff = targetTime.getTime() - now.getTime();

            if (diff <= 0) {
                hoursEl.textContent = '00';
                minutesEl.textContent = '00';
                secondsEl.textContent = '00';
                return;
            }

            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            hoursEl.textContent = String(h).padStart(2, '0');
            minutesEl.textContent = String(m).padStart(2, '0');
            secondsEl.textContent = String(s).padStart(2, '0');
        };

        setInterval(update, 1000);
        update();
    }

    private loadDailyDua() {
        // Just load Day 1 for now
        const dua = duas[0];
        const arabicEl = document.querySelector('.dua-arabic');
        const transEl = document.querySelector('.dua-trans');

        if (arabicEl) arabicEl.textContent = dua.arabic;
        if (transEl) transEl.textContent = dua.translation;
    }

    private initTracker() {
        const checkboxes = document.querySelectorAll('.tracker-item input[type="checkbox"]');

        checkboxes.forEach(chk => {
            const el = chk as HTMLInputElement;
            const key = `ramadan_track_${el.id}_${new Date().toDateString()}`;

            // Load state
            const saved = localStorage.getItem(key);
            if (saved === 'true') el.checked = true;

            // Save state
            el.addEventListener('change', () => {
                localStorage.setItem(key, String(el.checked));
                // Optional: Trigger confetti if completed
                if (el.checked) {
                    // confetti logic here if available
                }
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RamadanManager();
});
