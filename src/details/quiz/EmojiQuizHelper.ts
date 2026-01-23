/**
 * Emoji Quiz Helper - Maps words to emojis for "Picture" Quiz
 */
export class EmojiQuizHelper {
    private static emojiMap: Record<string, string> = {
        // Animals
        'hund': '🐶', 'katt': '🐱', 'fågel': '🐦', 'häst': '🐴', 'ko': '🐮',
        'gris': '🐷', 'får': '🐑', 'kanin': '🐰', 'björn': '🐻', 'lejon': '🦁',
        'tiger': '🐯', 'elefant': '🐘', 'apa': '🐵', 'fisk': '🐟', 'val': '🐋',
        'orm': '🐍', 'spindel': '🕷️', 'bi': '🐝', 'fjäril': '🦋', 'räv': '🦊',
        'älg': '🫎', 'varg': '🐺', 'mus': '🐭', 'groda': '🐸', 'sköldpadda': '🐢',

        // Nature
        'sol': '☀️', 'måne': '🌙', 'stjärna': '⭐', 'moln': '☁️', 'regn': '🌧️',
        'snö': '❄️', 'eld': '🔥', 'vatten': '💧', 'träd': '🌳', 'blomma': '🌸',
        'skog': '🌲', 'berg': '🏔️', 'hav': '🌊', 'strand': '🏖️', 'ö': '🏝️',
        'blad': '🍃', 'gräs': '🌱', 'sten': '🪨', 'regnbåge': '🌈', 'blixt': '⚡',

        // Food
        'äpple': '🍎', 'banan': '🍌', 'päron': '🍐', 'apelsin': '🍊', 'citron': '🍋',
        'druvor': '🍇', 'jordgubbe': '🍓', 'tomat': '🍅', 'potatis': '🥔', 'morot': '🥕',
        'bröd': '🍞', 'kött': '🥩', 'ägg': '🥚', 'ost': '🧀', 'pizza': '🍕',
        'burgare': '🍔', 'glass': '🍦', 'kaka': '🍰', 'kaffe': '☕', 'mjölk': '🥛',
        'ris': '🍚', 'sås': '🥣', 'kyckling': '🍗',

        // Objects/Home
        'hus': '🏠', 'bil': '🚗', 'cykel': '🚲', 'båt': '⛵', 'flygplan': '✈️',
        'tåg': '🚆', 'buss': '🚌', 'dator': '💻', 'telefon': '📱', 'klocka': '⌚',
        'bok': '📖', 'penna': '✏️', 'stol': '🪑', 'säng': '🛌', 'nyckel': '🔑',
        'väska': '👜', 'glasögon': '👓', 'hatt': '🎩', 'skor': '👞', 'kläder': '👕',
        'dörr': '🚪', 'fönster': '🪟', 'bord': '5️⃣', 'lampa': '💡', 'sax': '✂️',

        // Body
        'öga': '👁️', 'öra': '👂', 'näsa': '👃', 'mun': '👄', 'hand': '✋',
        'fot': '🦶', 'hjärta': '❤️', 'hjärna': '🧠', 'tand': '🦷', 'hår': '💇',

        // People/Professions
        'läkare': '👨‍⚕️', 'lärare': '🧑‍🏫', 'polis': '👮', 'bebis': '👶', 'kvinna': '👩',
        'man': '👨', 'flicka': '👧', 'pojke': '👦', 'familj': '👨‍👩‍👧‍👦', 'kung': '👑',
    };

    static getEmoji(word: string): string | null {
        const lower = word.toLowerCase();
        // Exact match
        if (this.emojiMap[lower]) return this.emojiMap[lower];

        // Prefix match (for compounds e.g. "fotboll" -> "fot" maybe?) - careful
        // Let's stick to safe matches or simple normalization

        // Return random if in dev/test mode? No, better strict.
        return null;
    }

    static hasEmoji(word: string): boolean {
        return !!this.getEmoji(word);
    }
}
