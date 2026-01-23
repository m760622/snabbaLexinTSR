import { showToast } from '../../utils';

/**
 * Share Manager - Share words on social media
 */
export class ShareManager {
    static share(wordData: any[]) {
        const swe = wordData[2];
        const arb = wordData[3];
        const type = wordData[1];

        const text = `📚 تعلمت كلمة جديدة!\n\n🇸🇪 ${swe} (${type})\n🇸🇦 ${arb}\n\n#SnabbaLexin #LearnSwedish`;

        if (navigator.share) {
            navigator.share({
                title: `${swe} - SnabbaLexin`,
                text: text,
                url: window.location.href
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(text);
            showToast('<span class="sv-text">Kopierad!</span><span class="ar-text">تم النسخ!</span>');
        }
    }

    static renderShareButton(container: HTMLElement, wordData: any[]) {
        const btn = document.createElement('button');
        btn.className = 'share-btn';
        btn.innerHTML = '📤 <span class="sv-text">Dela</span><span class="ar-text">مشاركة</span>';
        btn.onclick = () => this.share(wordData);
        container.appendChild(btn);
    }
}
