import { AppConfig } from './config';
// import { DictionaryEntry } from './types'; // Placeholder for future use

/**
 * SnabbaLexin - IndexedDB Database Module
 * Provides fast local storage for dictionary data with caching
 */

export const DictionaryDB = {
    DB_NAME: AppConfig.DB_NAME,
    DB_VERSION: AppConfig.DB_VERSION,
    STORE_NAME: 'words',
    META_STORE: 'meta',
    NOTES_STORE: 'notes',
    TRAINING_STORE: 'training',

    db: null as IDBDatabase | null,
    isReady: false,

    /**
     * Initialize the database
     */
    async init(): Promise<boolean> {
        if (this.db) return true;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = (event: any) => {
                console.error('[DB] Error opening database:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event: any) => {
                this.db = event.target.result;
                this.isReady = true;
                console.log('[DB] Database opened successfully');
                resolve(true);
            };

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;

                // Create words store if not exists
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const wordStore = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                    wordStore.createIndex('swedish', 'swe', { unique: false });
                    wordStore.createIndex('arabic', 'arb', { unique: false });
                    wordStore.createIndex('type', 'type', { unique: false });
                    console.log('[DB] Words store created');
                }

                // Create meta store for version tracking
                if (!db.objectStoreNames.contains(this.META_STORE)) {
                    db.createObjectStore(this.META_STORE, { keyPath: 'key' });
                    console.log('[DB] Meta store created');
                }

                // Create notes store for personal markings
                if (!db.objectStoreNames.contains(this.NOTES_STORE)) {
                    db.createObjectStore(this.NOTES_STORE, { keyPath: 'id' });
                    console.log('[DB] Notes store created');
                }

                // Create training store with index
                if (!db.objectStoreNames.contains(this.TRAINING_STORE)) {
                    const trainingStore = db.createObjectStore(this.TRAINING_STORE, { keyPath: 'id' });
                    trainingStore.createIndex('addedAt', 'addedAt', { unique: false });
                    console.log('[DB] Training store created with addedAt index');
                } else {
                    // Add index to existing store if missing (migration)
                    const tx = event.target.transaction;
                    if (tx) {
                        const trainingStore = tx.objectStore(this.TRAINING_STORE);
                        if (!trainingStore.indexNames.contains('addedAt')) {
                            trainingStore.createIndex('addedAt', 'addedAt', { unique: false });
                            console.log('[DB] Added addedAt index to existing training store');
                        }
                    }
                }
            };
        });
    },

    /**
     * Get cached data version
     */
    async getDataVersion(): Promise<string | null> {
        if (!this.db) await this.init();
        if (!this.db) return null;

        return new Promise((resolve) => {
            try {
                const tx = this.db!.transaction([this.META_STORE], 'readonly');
                const store = tx.objectStore(this.META_STORE);
                const request = store.get('dataVersion');

                request.onsuccess = () => {
                    resolve(request.result?.value || null);
                };
                request.onerror = () => resolve(null);
            } catch (e) {
                resolve(null);
            }
        });
    },

    /**
     * Set data version
     */
    async setDataVersion(version: string): Promise<boolean> {
        if (!this.db) await this.init();
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([this.META_STORE], 'readwrite');
            const store = tx.objectStore(this.META_STORE);
            store.put({ key: 'dataVersion', value: version });

            tx.oncomplete = () => resolve(true);
            tx.onerror = (e) => reject(e);
        });
    },

    /**
     * Get word count in database
     */
    async getWordCount(): Promise<number> {
        if (!this.db) await this.init();
        if (!this.db) return 0;

        return new Promise((resolve) => {
            try {
                const tx = this.db!.transaction([this.STORE_NAME], 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const request = store.count();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => resolve(0);
            } catch (e) {
                resolve(0);
            }
        });
    },

    /**
     * Save words to IndexedDB (bulk save with progress)
     */
    async saveWords(words: any[][], onProgress: ((p: number) => void) | null = null): Promise<boolean> {
        if (!this.db) await this.init();

        const BATCH_SIZE = 1000;
        const totalBatches = Math.ceil(words.length / BATCH_SIZE);

        console.log(`[DB] Saving ${words.length} words in ${totalBatches} batches...`);

        for (let batch = 0; batch < totalBatches; batch++) {
            const start = batch * BATCH_SIZE;
            const end = Math.min(start + BATCH_SIZE, words.length);
            const batchWords = words.slice(start, end);

            await this._saveBatch(batchWords);

            if (onProgress) {
                const progress = Math.round(((batch + 1) / totalBatches) * 100);
                onProgress(progress);
            }
        }

        console.log('[DB] All words saved successfully');
        return true;
    },

    /**
     * Save a batch of words
     * @private
     */
    async _saveBatch(words: any[][]): Promise<boolean> {
        if (!this.db) return false;
        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([this.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);

            words.forEach(word => {
                const wordObj = {
                    id: word[AppConfig.COLUMNS.ID],
                    type: word[AppConfig.COLUMNS.TYPE],
                    swe: word[AppConfig.COLUMNS.SWEDISH],
                    arb: word[AppConfig.COLUMNS.ARABIC],
                    arbExt: word[AppConfig.COLUMNS.ARABIC_EXT],
                    sweDef: word[AppConfig.COLUMNS.DEFINITION],
                    forms: word[AppConfig.COLUMNS.FORMS],
                    sweEx: word[AppConfig.COLUMNS.EXAMPLE_SWE],
                    arbEx: word[AppConfig.COLUMNS.EXAMPLE_ARB],
                    idiomSwe: word[AppConfig.COLUMNS.IDIOM_SWE],
                    idiomArb: word[AppConfig.COLUMNS.IDIOM_ARB],
                    raw: word
                };
                store.put(wordObj);
            });

            tx.oncomplete = () => resolve(true);
            tx.onerror = (e) => reject(e);
        });
    },

    /**
     * Get all words as original array format
     */
    async getAllWords(onProgress: ((p: number) => void) | null = null): Promise<any[][]> {
        if (!this.db) await this.init();
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([this.STORE_NAME], 'readonly');
            const store = tx.objectStore(this.STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const words = request.result.map((w: any) => w.raw);
                if (onProgress) onProgress(100);
                console.log(`[DB] Retrieved ${words.length} words from cache`);
                resolve(words);
            };

            request.onerror = (e) => {
                console.error('[DB] Error getting words:', e);
                reject(e);
            };
        });
    },

    /**
     * Check if database has cached data
     */
    async hasCachedData(): Promise<boolean> {
        const count = await this.getWordCount();
        return count > 0;
    },

    /**
     * Clear all cached data
     */
    async clearCache(): Promise<boolean> {
        if (!this.db) await this.init();
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([this.STORE_NAME, this.META_STORE], 'readwrite');
            tx.objectStore(this.STORE_NAME).clear();
            tx.objectStore(this.META_STORE).clear();

            tx.oncomplete = () => {
                console.log('[DB] Cache cleared');
                resolve(true);
            };
            tx.onerror = (e) => reject(e);
        });
    },

    /**
     * Get a single word by ID
     */
    async getWordById(id: string): Promise<any[] | null> {
        if (!this.db) await this.init();
        if (!this.db) return null;

        return new Promise((resolve) => {
            try {
                const tx = this.db!.transaction([this.STORE_NAME], 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const request = store.get(id);

                request.onsuccess = () => {
                    if (request.result && request.result.raw) {
                        resolve(request.result.raw);
                    } else {
                        resolve(null);
                    }
                };
                request.onerror = () => resolve(null);
            } catch (e) {
                console.error('[DB] getWordById error:', e);
                resolve(null);
            }
        });
    },

    /**
     * Get a random word from the database
     */
    async getRandomWord(): Promise<any | null> {
        if (!this.db) await this.init();
        if (!this.db) return null;

        return new Promise(async (resolve) => {
            try {
                const count = await this.getWordCount();
                if (count === 0) {
                    resolve(null);
                    return;
                }

                const randomIndex = Math.floor(Math.random() * count);
                const tx = this.db!.transaction([this.STORE_NAME], 'readonly');
                const store = tx.objectStore(this.STORE_NAME);
                const request = store.openCursor(); // Use cursor to advance to random position
                let hasAdvanced = false;

                request.onsuccess = (event: any) => {
                    const cursor = event.target.result;
                    if (!cursor) {
                        resolve(null);
                        return;
                    }

                    if (!hasAdvanced && randomIndex > 0) {
                        hasAdvanced = true;
                        cursor.advance(randomIndex);
                    } else {
                        const wordData = cursor.value.raw || cursor.value;
                        // Basic validation to ensure we don't return malformed objects
                        if (wordData && (wordData.swedish || wordData.swe)) {
                            // Normalize if needed
                            if (!wordData.swedish && wordData.swe) wordData.swedish = wordData.swe;
                            if (!wordData.arabic && wordData.arb) wordData.arabic = wordData.arb;
                            resolve(wordData);
                        } else {
                            // If bad data, keep looking or resolve null (to avoid crash)
                            // Trying to continue would require recursion or complex cursor logic.
                            // Safest is to resolve null and let caller handle it.
                            resolve(null);
                        }
                    }
                };
                request.onerror = () => resolve(null);
            } catch (e) {
                console.error('[DB] getRandomWord error:', e);
                resolve(null);
            }
        });
    },

    /**
     * Save a single word to IndexedDB
     */
    async saveWord(word: any): Promise<boolean> {
        if (!this.db) await this.init();
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([this.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            store.put(word);

            tx.oncomplete = () => resolve(true);
            tx.onerror = (e) => reject(e);
        });
    },

    /**
     * Delete a word by ID
     */
    async deleteWord(id: string): Promise<boolean> {
        if (!this.db) await this.init();
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([this.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            store.delete(id);

            tx.oncomplete = () => resolve(true);
            tx.onerror = (e) => reject(e);
        });
    },

    /**
     * Get personal note for a word
     */
    async getNote(id: string): Promise<string | null> {
        if (!this.db) await this.init();
        if (!this.db) return null;

        return new Promise((resolve) => {
            try {
                const tx = this.db!.transaction([this.NOTES_STORE], 'readonly');
                const store = tx.objectStore(this.NOTES_STORE);
                const request = store.get(id);

                request.onsuccess = () => {
                    resolve(request.result?.text || null);
                };
                request.onerror = () => resolve(null);
            } catch (e) {
                resolve(null);
            }
        });
    },

    /**
     * Save personal note for a word
     */
    async saveNote(id: string, text: string): Promise<boolean> {
        if (!this.db) await this.init();
        if (!this.db) return false;

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([this.NOTES_STORE], 'readwrite');
            const store = tx.objectStore(this.NOTES_STORE);
            store.put({ id, text, updatedAt: Date.now() });

            tx.oncomplete = () => resolve(true);
            tx.onerror = (e) => reject(e);
        });
    },

    /**
     * Update training status for a word
     */
    async updateTrainingStatus(wordId: string, needsTraining: boolean): Promise<void> {
        if (!wordId) {
            console.warn('[DB] updateTrainingStatus called with empty wordId');
            return;
        }

        if (!this.db) await this.init();
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([this.TRAINING_STORE], 'readwrite');
            const store = tx.objectStore(this.TRAINING_STORE);

            if (needsTraining) {
                store.put({ id: wordId, addedAt: Date.now() });
            } else {
                store.delete(wordId);
            }

            tx.oncomplete = () => {
                console.log(`[DB] Training status updated for ${wordId}: ${needsTraining}`);
                resolve();
            };
            tx.onerror = (e) => {
                console.error(`[DB] Error updating training status:`, e);
                resolve(); // Don't reject, just continue
            };
        });
    },

    /**
     * Ensure a custom word exists in the database
     */
    async ensureCustomWord(wordObj: any): Promise<void> {
        if (!this.db) await this.init();
        if (!this.db) return;

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction([this.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);

            const request = store.get(wordObj.id);
            request.onsuccess = () => {
                if (!request.result) {
                    store.put(wordObj);
                    console.log(`[DB] Custom word ${wordObj.id} created`);
                }
            };

            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e);
        });
    },

    /**
     * Get all words marked for training
     */
    async getTrainingWords(): Promise<any[]> {
        if (!this.db) await this.init();
        if (!this.db) return [];

        return new Promise((resolve, reject) => {
            // First, get all training entries
            const tx = this.db!.transaction([this.TRAINING_STORE, this.STORE_NAME], 'readonly');
            const trainingStore = tx.objectStore(this.TRAINING_STORE);
            const wordsStore = tx.objectStore(this.STORE_NAME);

            const trainingRequest = trainingStore.index('addedAt').getAll();

            trainingRequest.onsuccess = async () => {
                const trainingEntries = trainingRequest.result;

                if (trainingEntries.length === 0) {
                    console.log('[DB] Found 0 words for training');
                    resolve([]);
                    return;
                }

                // Hydrate with full word data from words store
                const trainingWords: any[] = [];
                let completed = 0;

                for (const entry of trainingEntries) {
                    const wordRequest = wordsStore.get(entry.id);
                    wordRequest.onsuccess = () => {
                        if (wordRequest.result) {
                            trainingWords.push(wordRequest.result.raw || wordRequest.result);
                        } else {
                            // Word not in words store, create minimal entry
                            trainingWords.push({ id: entry.id });
                        }
                        completed++;
                        if (completed === trainingEntries.length) {
                            console.log(`[DB] Found ${trainingWords.length} words for training`);
                            resolve(trainingWords);
                        }
                    };
                    wordRequest.onerror = () => {
                        completed++;
                        if (completed === trainingEntries.length) {
                            console.log(`[DB] Found ${trainingWords.length} words for training`);
                            resolve(trainingWords);
                        }
                    };
                }
            };

            trainingRequest.onerror = (e) => reject(e);
        });
    },

    /**
     * Check if a word is marked for training
     */
    async isWordMarkedForTraining(wordId: string): Promise<boolean> {
        if (!this.db) await this.init();
        if (!this.db) return false;

        return new Promise((resolve) => {
            const tx = this.db!.transaction([this.TRAINING_STORE], 'readonly');
            const store = tx.objectStore(this.TRAINING_STORE);
            const request = store.get(wordId);

            request.onsuccess = () => {
                // If the entry exists in the training store, the word is marked for training
                resolve(!!request.result);
            };
            request.onerror = () => resolve(false);
        });
    }
};

/**
 * Progressive data loader with caching
 */
export const DataLoader = {
    async loadDictionary(onProgress: ((p: number) => void) | null = null, onStatusChange: ((s: string) => void) | null = null): Promise<any[][]> {
        try {
            await DictionaryDB.init();

            const cachedVersion = await DictionaryDB.getDataVersion();
            const hasCached = await DictionaryDB.hasCachedData();

            if (hasCached && cachedVersion === AppConfig.DATA_VERSION) {
                if (onStatusChange) onStatusChange('Laddar från cache... / جاري التحميل من الذاكرة...');
                console.log('[DataLoader] Using cached data (version:', cachedVersion, ')');
                return await DictionaryDB.getAllWords(onProgress);
            }

            if (onStatusChange) onStatusChange('Laddar ordbok... / جاري تحميل القاموس...');
            console.log('[DataLoader] Loading fresh data from data.js');

            let dictionaryData = (window as any).dictionaryData;

            // Fallback: Fetch from JSON if not in global scope
            if (typeof dictionaryData === 'undefined' || !dictionaryData.length) {
                if (onStatusChange) onStatusChange('Laddar datafil... / جاري تحميل ملف البيانات...');
                console.log('[DataLoader] Global data missing, fetching from', AppConfig.DATA_PATH.root);

                try {
                    const response = await fetch(AppConfig.DATA_PATH.root);
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    dictionaryData = await response.json();

                    // Optional: expose to window to prevent re-fetching in same session
                    (window as any).dictionaryData = dictionaryData;
                } catch (fetchError) {
                    console.error('[DataLoader] Fetch failed:', fetchError);
                    throw new Error('dictionaryData could not be loaded');
                }
            }

            if (onStatusChange) onStatusChange('Sparar i cache... / جاري الحفظ...');
            await DictionaryDB.saveWords(dictionaryData, onProgress);
            await DictionaryDB.setDataVersion(AppConfig.DATA_VERSION);

            console.log('[DataLoader] Data cached successfully');
            return dictionaryData;

        } catch (error) {
            console.error('[DataLoader] Error:', error);
            const dictionaryData = (window as any).dictionaryData;
            if (typeof dictionaryData !== 'undefined') {
                return dictionaryData;
            }
            throw error;
        }
    },

    async refreshCache(onProgress: ((p: number) => void) | null = null) {
        await DictionaryDB.clearCache();
        return this.loadDictionary(onProgress);
    }
};

// Global exports for legacy support
if (typeof window !== 'undefined') {
    (window as any).DictionaryDB = DictionaryDB;
    (window as any).DataLoader = DataLoader;
    (window as any).DATA_VERSION = AppConfig.DATA_VERSION;
}
