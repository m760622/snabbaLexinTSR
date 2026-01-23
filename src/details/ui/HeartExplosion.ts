/**
 * Heart Explosion Effect Manager
 */
export class HeartExplosion {
    static spawn(x: number, y: number) {
        const count = 15;
        for (let i = 0; i < count; i++) {
            const heart = document.createElement('div');
            heart.innerHTML = '❤️';
            heart.className = 'heart-particle';

            // Random spread for explosion effect
            const tx = (Math.random() - 0.5) * 100; // Spread -50px to 50px
            const ty = (Math.random() - 1) * 100;   // Upward mostly

            heart.style.left = x + 'px';
            heart.style.top = y + 'px';
            heart.style.setProperty('--tx', `${tx}px`);

            // Random size variation
            const scale = 0.5 + Math.random() * 1;
            heart.style.transform = `scale(${scale})`;

            document.body.appendChild(heart);

            // Cleanup
            setTimeout(() => heart.remove(), 1000);
        }
    }
}
