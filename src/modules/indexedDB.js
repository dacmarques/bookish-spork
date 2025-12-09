/**
 * IndexedDB Manager for Large Data
 * Stores file contents, large datasets (no 5MB limit)
 */

import { showToast } from './toast.js';

class IDBManager {
    constructor() {
        this.dbName = 'UET_Database';
        this.version = 1;
        this.db = null;
    }

    /**
     * Initialize database
     */
    async init() {
        if (this.db) return this.db;
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store for file contents
                if (!db.objectStoreNames.contains('files')) {
                    const fileStore = db.createObjectStore('files', { keyPath: 'id' });
                    fileStore.createIndex('timestamp', 'timestamp', { unique: false });
                    fileStore.createIndex('type', 'type', { unique: false });
                }
                
                // Store for work sessions
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
                    sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                
                // Store for large datasets
                if (!db.objectStoreNames.contains('datasets')) {
                    const dataStore = db.createObjectStore('datasets', { keyPath: 'id' });
                    dataStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    /**
     * Save file data
     */
    async saveFile(id, data, type) {
        try {
            if (!this.db) await this.init();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['files'], 'readwrite');
                const store = transaction.objectStore('files');
                
                const file = {
                    id,
                    type,
                    data,
                    timestamp: Date.now(),
                    size: JSON.stringify(data).length
                };
                
                const request = store.put(file);
                request.onsuccess = () => resolve(file);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error('Failed to save file:', e);
            throw e;
        }
    }

    /**
     * Get file data
     */
    async getFile(id) {
        try {
            if (!this.db) await this.init();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['files'], 'readonly');
                const store = transaction.objectStore('files');
                const request = store.get(id);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error('Failed to get file:', e);
            return null;
        }
    }

    /**
     * Get all files
     */
    async getAllFiles() {
        try {
            if (!this.db) await this.init();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['files'], 'readonly');
                const store = transaction.objectStore('files');
                const request = store.getAll();
                
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error('Failed to get all files:', e);
            return [];
        }
    }

    /**
     * Delete file
     */
    async deleteFile(id) {
        try {
            if (!this.db) await this.init();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['files'], 'readwrite');
                const store = transaction.objectStore('files');
                const request = store.delete(id);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error('Failed to delete file:', e);
            throw e;
        }
    }

    /**
     * Save work session
     */
    async saveSession(id, sessionData) {
        try {
            if (!this.db) await this.init();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['sessions'], 'readwrite');
                const store = transaction.objectStore('sessions');
                
                const session = {
                    id,
                    data: sessionData,
                    timestamp: Date.now(),
                    size: JSON.stringify(sessionData).length
                };
                
                const request = store.put(session);
                request.onsuccess = () => resolve(session);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error('Failed to save session:', e);
            throw e;
        }
    }

    /**
     * Get work session
     */
    async getSession(id) {
        try {
            if (!this.db) await this.init();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['sessions'], 'readonly');
                const store = transaction.objectStore('sessions');
                const request = store.get(id);
                
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error('Failed to get session:', e);
            return null;
        }
    }

    /**
     * Get all sessions
     */
    async getAllSessions() {
        try {
            if (!this.db) await this.init();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['sessions'], 'readonly');
                const store = transaction.objectStore('sessions');
                const request = store.getAll();
                
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error('Failed to get all sessions:', e);
            return [];
        }
    }

    /**
     * Delete session
     */
    async deleteSession(id) {
        try {
            if (!this.db) await this.init();
            
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['sessions'], 'readwrite');
                const store = transaction.objectStore('sessions');
                const request = store.delete(id);
                
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        } catch (e) {
            console.error('Failed to delete session:', e);
            throw e;
        }
    }

    /**
     * Cleanup old files
     */
    async cleanupOldFiles(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
        try {
            const files = await this.getAllFiles();
            const now = Date.now();
            
            const promises = files
                .filter(f => now - f.timestamp > maxAge)
                .map(f => this.deleteFile(f.id));
            
            await Promise.all(promises);
            return promises.length;
        } catch (e) {
            console.error('Failed to cleanup old files:', e);
            return 0;
        }
    }

    /**
     * Cleanup old sessions
     */
    async cleanupOldSessions(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
        try {
            const sessions = await this.getAllSessions();
            const now = Date.now();
            
            const promises = sessions
                .filter(s => now - s.timestamp > maxAge)
                .map(s => this.deleteSession(s.id));
            
            await Promise.all(promises);
            return promises.length;
        } catch (e) {
            console.error('Failed to cleanup old sessions:', e);
            return 0;
        }
    }

    /**
     * Get storage usage (if supported)
     */
    async getUsage() {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                return {
                    used: estimate.usage,
                    total: estimate.quota,
                    percentage: (estimate.usage / estimate.quota) * 100,
                    usedMB: (estimate.usage / 1024 / 1024).toFixed(2),
                    totalMB: (estimate.quota / 1024 / 1024).toFixed(2)
                };
            }
            return null;
        } catch (e) {
            console.error('Failed to get storage usage:', e);
            return null;
        }
    }

    /**
     * Get database statistics
     */
    async getStatistics() {
        try {
            const files = await this.getAllFiles();
            const sessions = await this.getAllSessions();
            const usage = await this.getUsage();
            
            const totalFileSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
            const totalSessionSize = sessions.reduce((sum, s) => sum + (s.size || 0), 0);
            
            return {
                files: {
                    count: files.length,
                    totalSize: totalFileSize,
                    sizeMB: (totalFileSize / 1024 / 1024).toFixed(2)
                },
                sessions: {
                    count: sessions.length,
                    totalSize: totalSessionSize,
                    sizeMB: (totalSessionSize / 1024 / 1024).toFixed(2)
                },
                usage
            };
        } catch (e) {
            console.error('Failed to get statistics:', e);
            return null;
        }
    }

    /**
     * Clear all data
     */
    async clearAll() {
        try {
            if (!this.db) await this.init();
            
            const stores = ['files', 'sessions', 'datasets'];
            const promises = stores.map(storeName => {
                return new Promise((resolve, reject) => {
                    const transaction = this.db.transaction([storeName], 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const request = store.clear();
                    
                    request.onsuccess = () => resolve();
                    request.onerror = () => reject(request.error);
                });
            });
            
            await Promise.all(promises);
            return true;
        } catch (e) {
            console.error('Failed to clear all data:', e);
            return false;
        }
    }
}

export const idbManager = new IDBManager();

/**
 * Initialize IndexedDB and run cleanup on startup
 */
export async function initializeIndexedDB() {
    try {
        await idbManager.init();
        
        // Cleanup old files (older than 7 days)
        const deletedFiles = await idbManager.cleanupOldFiles();
        if (deletedFiles > 0) {
            console.log(`🗑️ Cleaned up ${deletedFiles} old files from IndexedDB`);
        }
        
        // Cleanup old sessions (older than 30 days)
        const deletedSessions = await idbManager.cleanupOldSessions();
        if (deletedSessions > 0) {
            console.log(`🗑️ Cleaned up ${deletedSessions} old sessions from IndexedDB`);
        }
        
        // Log statistics
        const stats = await idbManager.getStatistics();
        if (stats) {
            console.log('📊 IndexedDB Stats:', {
                files: stats.files.count,
                sessions: stats.sessions.count,
                totalSize: (parseInt(stats.files.sizeMB) + parseInt(stats.sessions.sizeMB)).toFixed(2) + 'MB'
            });
        }
    } catch (e) {
        console.warn('IndexedDB initialization failed:', e);
    }
}
