/**
 * Motivation Manager - Display motivational quotes
 */
export class MotivationManager {
    private static quotes = [
        {
            text: `<span class="sv-text">Varje nytt ord är ett fönster mot en ny värld</span><span class="ar-text">كل كلمة جديدة هي نافذة على عالم جديد</span>`,
            author: `<span class="sv-text">Okänd</span><span class="ar-text">مجهول</span>`
        },
        {
            text: `<span class="sv-text">Lärande är ingen tävling, det är en resa</span><span class="ar-text">التعلم ليس سباقاً، بل رحلة</span>`,
            author: `<span class="sv-text">Visdom</span><span class="ar-text">حكمة</span>`
        },
        {
            text: `<span class="sv-text">Den som lär sig ett språk, förstår en kultur</span><span class="ar-text">من يتعلم لغة، يفهم ثقافة</span>`,
            author: `<span class="sv-text">Ordspråk</span><span class="ar-text">مثل</span>`
        },
        {
            text: `<span class="sv-text">Språket är nationens själ</span><span class="ar-text">اللغة هي روح الأمة</span>`, // Corrected incomplete quote from source
            author: `<span class="sv-text">Fichte</span><span class="ar-text">فيخته</span>`
        }
    ];

    static getRandomQuote() {
        return this.quotes[Math.floor(Math.random() * this.quotes.length)];
    }

    static renderQuote(container: HTMLElement) {
        const quote = this.getRandomQuote();
        const el = document.createElement('div');
        el.className = 'motivation-quote';
        el.innerHTML = `
            <p>"${quote.text}"</p>
            <div class="author">— ${quote.author}</div>
        `;
        container.appendChild(el);
    }
}
