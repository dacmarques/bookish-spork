/**
 * Enhanced Storage Module
 * Robust localStorage/sessionStorage with quota management
 */

import { showToast } from './toast.js';

class StorageManager {
    constructor(storageType = 'local') {
        this.storage = storageType === 'local' ? localStorage : sessionStorage;
        this.prefix = 'uet_';
        this.quotaWarningThreshold = 0.8; // 80% usage
    }

    /**
     * Get storage usage info
     */
    getUsageInfo() {
        let totalSize = 0;
        for (let key in this.storage) {
            if (this.storage.hasOwnProperty(key)) {
                totalSize += (this.storage[key].length + key.length) * 2; // UTF-16
            }
        }
        
        const quota = 5 * 1024 * 1024; // 5MB typical limit
        return {
            used: totalSize,
            total: quota,
            percentage: (totalSize / quota) * 100,
            available: quota - totalSize,
            usedMB: (totalSize / 1024 / 1024).toFixed(2),
            totalMB: (quota / 1024 / 1024).toFixed(2)
        };
    }

    /**
     * Set item with quota checking
     */
    setItem(key, value, options = {}) {
        const fullKey = this.prefix + key;
        const serialized = JSON.stringify(value);
        
        try {
            // Check quota before setting
            const usage = this.getUsageInfo();
            const itemSize = (fullKey.length + serialized.length) * 2;
            
            if (usage.used + itemSize > usage.total) {
                if (options.autoCleanup) {
                    this.cleanup();
                    return this.setItem(key, value, { ...options, autoCleanup: false });
                }
                
                window.dispatchEvent(new CustomEvent('storageQuotaExceeded', {
                    detail: { usage }
                }));
                
                throw new Error('QUOTA_EXCEEDED');
            }
            
            this.storage.setItem(fullKey, serialized);
            
            // Warn if approaching limit
            const newUsage = this.getUsageInfo();
            if (newUsage.percentage > this.quotaWarningThreshold * 100) {
                window.dispatchEvent(new CustomEvent('storageWarning', {
                    detail: { usage: newUsage.percentage, info: newUsage }
                }));
            }
            
            return { success: true, usage: newUsage };
        } catch (e) {
            if (e.name === 'QuotaExceededError' || e.message === 'QUOTA_EXCEEDED') {
                return { 
                    success: false, 
                    error: 'QUOTA_EXCEEDED', 
                    usage: this.getUsageInfo() 
                };
            }
            console.error(`Storage error for key ${key}:`, e);
            return { success: false, error: e.message };
        }
    }

    /**
     * Get item
     */
    getItem(key, defaultValue = null) {
        try {
            const fullKey = this.prefix + key;
            const item = this.storage.getItem(fullKey);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error(`Failed to get ${key}:`, e);
            return defaultValue;
        }
    }

    /**
     * Remove item
     */
    removeItem(key) {
        const fullKey = this.prefix + key;
        this.storage.removeItem(fullKey);
    }

    /**
     * Check if key exists
     */
    hasItem(key) {
        const fullKey = this.prefix + key;
        return this.storage.getItem(fullKey) !== null;
    }

    /**
     * Cleanup old data
     */
    cleanup(strategy = 'lru') {
        const items = this.getAllItems();
        
        if (strategy === 'lru') {
            // Remove least recently used
            const sorted = items.sort((a, b) => {
                const aTime = a.value?.timestamp || 0;
                const bTime = b.value?.timestamp || 0;
                return aTime - bTime;
            });
            
            // Remove oldest 20%
            const toRemove = Math.ceil(sorted.length * 0.2);
            let removedSize = 0;
            
            for (let i = 0; i < toRemove && i < sorted.length; i++) {
                const key = sorted[i].key.replace(this.prefix, '');
                removedSize += sorted[i].size;
                this.removeItem(key);
            }
            
            console.log(`Cleaned up ${toRemove} items, freed ${(removedSize / 1024).toFixed(2)} KB`);
            return { removed: toRemove, freedBytes: removedSize };
        } else if (strategy === 'size') {
            // Remove largest items
            const sorted = items.sort((a, b) => b.size - a.size);
            const toRemove = Math.ceil(sorted.length * 0.2);
            let removedSize = 0;
            
            for (let i = 0; i < toRemove && i < sorted.length; i++) {
                const key = sorted[i].key.replace(this.prefix, '');
                removedSize += sorted[i].size;
                this.removeItem(key);
            }
            
            return { removed: toRemove, freedBytes: removedSize };
        }
    }

    /**
     * Get all items with metadata
     */
    getAllItems() {
        const items = [];
        for (let key in this.storage) {
            if (key.startsWith(this.prefix)) {
                const value = this.getItem(key.replace(this.prefix, ''));
                items.push({
                    key,
                    shortKey: key.replace(this.prefix, ''),
                    size: (this.storage[key].length + key.length) * 2,
                    value,
                    timestamp: value?.timestamp || 0
                });
            }
        }
        return items;
    }

    /**
     * Get storage statistics
     */
    getStatistics() {
        const items = this.getAllItems();
        const usage = this.getUsageInfo();
        
        return {
            totalItems: items.length,
            usage,
            largestItem: items.reduce((max, item) => 
                item.size > (max?.size || 0) ? item : max, null),
            oldestItem: items.reduce((oldest, item) => 
                item.timestamp < (oldest?.timestamp || Infinity) ? item : oldest, null)
        };
    }

    /**
     * Clear all prefixed items
     */
    clear() {
        const keys = Object.keys(this.storage).filter(k => k.startsWith(this.prefix));
        keys.forEach(k => this.storage.removeItem(k));
        return keys.length;
    }

    /**
     * Export all data
     */
    exportAll() {
        const items = this.getAllItems();
        return {
            version: '1.0',
            timestamp: new Date().toISOString(),
            storageType: this.storage === localStorage ? 'local' : 'session',
            items: items.map(item => ({
                key: item.shortKey,
                value: item.value,
                size: item.size
            }))
        };
    }

    /**
     * Import data
     */
    importAll(data) {
        if (!data || !data.items) {
            throw new Error('Invalid import data');
        }
        
        let imported = 0;
        let failed = 0;
        
        data.items.forEach(item => {
            const result = this.setItem(item.key, item.value, { autoCleanup: true });
            if (result.success) {
                imported++;
            } else {
                failed++;
            }
        });
        
        return { imported, failed };
    }
}

export const localStorageManager = new StorageManager('local');
export const sessionStorageManager = new StorageManager('session');

/**
 * Initialize storage monitoring
 */
export function initializeStorageManagement() {
    // Monitor quota exceeded events
    window.addEventListener('storageQuotaExceeded', (e) => {
        const usage = e.detail.usage;
        showToast(
            `Storage full (${usage.usedMB}MB / ${usage.totalMB}MB). Please clear old data.`,
            'error',
            5000
        );
    });
    
    // Monitor storage warnings
    window.addEventListener('storageWarning', (e) => {
        const usage = e.detail.usage;
        const info = e.detail.info;
        
        if (usage > 90) {
            showToast(
                `Storage ${usage.toFixed(0)}% full (${info.usedMB}MB / ${info.totalMB}MB). Clear old data soon.`,
                'warning',
                5000
            );
        }
    });
    
    // Log initial storage status
    const stats = localStorageManager.getStatistics();
    console.log('📊 Storage initialized:', {
        items: stats.totalItems,
        used: stats.usage.usedMB + 'MB',
        percentage: stats.usage.percentage.toFixed(1) + '%'
    });
}
