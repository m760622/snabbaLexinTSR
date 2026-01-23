import { DictionaryDB } from '../../db';
import { t } from '../../i18n';

/**
 * Personal Notes Manager
 */
export class NotesManager {
    static async init(wordId: string) {
        const textarea = document.getElementById('wordNotes') as HTMLTextAreaElement;
        const saveBtn = document.getElementById('saveNotesBtn');
        const status = document.getElementById('notesStatus');

        if (!textarea || !saveBtn) return;

        // Load existing note
        const note = await DictionaryDB.getNote(wordId);
        if (note) textarea.value = note;

        saveBtn.onclick = async () => {
            const text = textarea.value.trim();
            (saveBtn as HTMLButtonElement).disabled = true;
            if (status) status.innerHTML = `<span class="sv-text">${t('details.saving')}</span><span class="ar-text">${t('details.saving')}</span>`;

            const success = await DictionaryDB.saveNote(wordId, text);

            (saveBtn as HTMLButtonElement).disabled = false;
            if (status) {
                status.innerHTML = success
                    ? `<span class="sv-text">${t('details.saved')}</span><span class="ar-text">${t('details.saved')}</span>`
                    : `<span class="sv-text">${t('common.error')}</span><span class="ar-text">${t('common.error')}</span>`;
                setTimeout(() => { status.innerHTML = ''; }, 3000);
            }
        };
    }
}
