/**
 * Smart Expandable Card Logic
 */
export class SmartCardManager {
    static init(container: HTMLElement) {
        // Find Sections: Definition and Examples
        const sections = container.querySelectorAll('.details-section');

        sections.forEach((section: Element) => {
            const sec = section as HTMLElement;
            // Only sections with specific content are candidates
            if (!sec.querySelector('.definition-card') && !sec.querySelector('.example-card')) return;

            // Wait for render/layout
            setTimeout(() => {
                if (sec.scrollHeight > 250) {
                    sec.classList.add('expandable');

                    const mask = document.createElement('div');
                    mask.className = 'expand-mask';

                    const btn = document.createElement('button');
                    btn.className = 'expand-btn';
                    btn.innerHTML = 'Visa mer <span class="ar-text">عرض المزيد</span>';

                    btn.addEventListener('click', () => {
                        sec.classList.add('expanded');
                        // Optional: remove mask/btn completely or animate them out
                    });

                    mask.appendChild(btn);
                    sec.appendChild(mask);
                }
            }, 100);
        });
    }
}
