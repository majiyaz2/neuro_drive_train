/**
 * Browser-compatible storage using localStorage.
 * Replaces the Node.js fs-based Storage for client-side use.
 */

interface StorageData {
    chromosomes: number[][];
}

export class BrowserStorage {
    private readonly key: string;

    constructor(key: string) {
        this.key = `neuro_drive_${key}`;
    }

    save(chromosomes: number[][]): void {
        if (typeof window === 'undefined') {
            console.warn('BrowserStorage: localStorage not available');
            return;
        }
        const data: StorageData = { chromosomes };
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving chromosomes to localStorage:', error);
        }
    }

    load(): number[][] {
        if (typeof window === 'undefined') {
            return [];
        }
        try {
            const stored = localStorage.getItem(this.key);
            if (!stored) {
                return [];
            }
            const data: StorageData = JSON.parse(stored);
            return data.chromosomes;
        } catch (error) {
            console.error('Error loading chromosomes from localStorage:', error);
            return [];
        }
    }

    clear(): void {
        if (typeof window === 'undefined') {
            return;
        }
        localStorage.removeItem(this.key);
    }
}
