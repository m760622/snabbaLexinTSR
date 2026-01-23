/**
 * Swipe Navigator - Handle touch swipe gestures
 */
export class SwipeNavigator {
    private static startX = 0;
    private static startY = 0;
    private static currentWordIndex = -1;

    static init(wordId: string) {
        const allData = (window as any).dictionaryData as any[][];
        if (!allData) return;

        // Find current word index
        this.currentWordIndex = allData.findIndex(row => row[0].toString() === wordId);
        if (this.currentWordIndex === -1) return;

        const container = document.getElementById('detailsArea');
        if (!container) return;

        // Add swipe hint arrows
        this.addSwipeHints(container);

        // Touch events
        container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        container.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
    }

    private static addSwipeHints(container: HTMLElement) {
        const hints = document.createElement('div');
        hints.className = 'swipe-hints';
        hints.innerHTML = `
            <span class="swipe-hint left" onclick="window.SwipeNavigator.navigate(-1)"><span class="sv-text">‹ Föregående</span><span class="ar-text">‹ السابق</span></span>
            <span class="swipe-hint right" onclick="window.SwipeNavigator.navigate(1)"><span class="sv-text">Nästa ›</span><span class="ar-text">التالي ›</span></span>
        `;
        container.prepend(hints);
    }

    private static handleTouchStart(e: TouchEvent) {
        this.startX = e.touches[0].clientX;
        this.startY = e.touches[0].clientY;
    }

    private static handleTouchEnd(e: TouchEvent) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - this.startX;
        const diffY = Math.abs(endY - this.startY);

        // Minimum swipe distance and must be horizontal
        if (Math.abs(diffX) > 80 && diffY < 50) {
            if (diffX > 0) {
                this.navigate(-1); // Swipe right = previous
            } else {
                this.navigate(1); // Swipe left = next
            }
        }
    }

    static navigate(direction: number) {
        const allData = (window as any).dictionaryData as any[][];
        if (!allData || this.currentWordIndex === -1) return;

        const newIndex = this.currentWordIndex + direction;
        if (newIndex >= 0 && newIndex < allData.length) {
            const newWordId = allData[newIndex][0];
            // Add slide animation
            document.getElementById('detailsArea')?.classList.add(direction > 0 ? 'slide-left' : 'slide-right');
            setTimeout(() => {
                window.location.href = `details.html?id=${newWordId}`;
            }, 150);
        }
    }
}

// Make globally available for onclick handlers
(window as any).SwipeNavigator = SwipeNavigator;
