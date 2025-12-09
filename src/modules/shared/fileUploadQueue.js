/**
 * File Upload Queue Management Module
 * Handles multi-file upload queue, retry mechanism, and detailed validation
 * Enhancement #11
 */

import { showToast } from '../toast.js';

/**
 * File upload queue
 */
class FileUploadQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.maxConcurrent = 1; // Process files one at a time
        this.maxRetries = 3;
    }

    /**
     * Add files to queue with validation
     * @param {FileList|File[]} files - Files to add
     * @param {Object} options - Upload options
     * @returns {Object} Validation result
     */
    addFiles(files, options = {}) {
        const filesArray = Array.from(files);
        const results = {
            valid: [],
            invalid: []
        };

        filesArray.forEach(file => {
            const validation = this.validateFile(file, options);
            
            if (validation.isValid) {
                const queueItem = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    file,
                    status: 'pending',
                    progress: 0,
                    retries: 0,
                    error: null,
                    processor: options.processor,
                    onProgress: options.onProgress,
                    onComplete: options.onComplete,
                    onError: options.onError
                };
                
                this.queue.push(queueItem);
                results.valid.push({ file, queueItem });
            } else {
                results.invalid.push({ file, errors: validation.errors });
            }
        });

        // Show validation feedback
        if (results.invalid.length > 0) {
            const errorMessages = results.invalid.map(item => 
                `${item.file.name}: ${item.errors.join(', ')}`
            ).join('\n');
            showToast(`⚠ Validation errors:\n${errorMessages}`, 'error', 5000);
        }

        if (results.valid.length > 0) {
            showToast(`✓ ${results.valid.length} file(s) added to queue`, 'success');
            this.processQueue();
        }

        return results;
    }

    /**
     * Validate file
     * @param {File} file - File to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateFile(file, options = {}) {
        const errors = [];
        const {
            allowedTypes = ['.xlsx', '.xls'],
            maxSize = 50 * 1024 * 1024, // 50MB default
            minSize = 1,
            customValidator = null
        } = options;

        // File type validation
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(fileExtension)) {
            errors.push(`Invalid type. Allowed: ${allowedTypes.join(', ')}`);
        }

        // File size validation
        if (file.size > maxSize) {
            const maxSizeMB = (maxSize / 1024 / 1024).toFixed(2);
            errors.push(`File too large. Max: ${maxSizeMB}MB`);
        }
        
        if (file.size < minSize) {
            errors.push('File is empty');
        }

        // File name validation
        if (file.name.length > 255) {
            errors.push('File name too long');
        }

        // Check for special characters that might cause issues
        if (/[<>:"|?*]/.test(file.name)) {
            errors.push('File name contains invalid characters');
        }

        // Custom validation
        if (customValidator && typeof customValidator === 'function') {
            const customErrors = customValidator(file);
            if (customErrors && Array.isArray(customErrors)) {
                errors.push(...customErrors);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Process upload queue
     */
    async processQueue() {
        if (this.processing) return;
        
        this.processing = true;

        while (this.queue.length > 0) {
            const item = this.queue[0];
            
            if (item.status === 'pending' || item.status === 'retrying') {
                await this.processItem(item);
            }
            
            // Remove completed or failed items from queue
            if (item.status === 'completed' || 
                (item.status === 'failed' && item.retries >= this.maxRetries)) {
                this.queue.shift();
            } else if (item.status === 'failed') {
                // Move to end for retry
                this.queue.push(this.queue.shift());
            } else {
                // Remove processed item
                this.queue.shift();
            }
        }

        this.processing = false;
    }

    /**
     * Process a single queue item
     * @param {Object} item - Queue item
     */
    async processItem(item) {
        try {
            item.status = 'processing';
            
            // Call processor with progress callback
            if (item.processor && typeof item.processor === 'function') {
                await item.processor(item.file, (progress) => {
                    item.progress = progress;
                    if (item.onProgress) {
                        item.onProgress(item.file, progress);
                    }
                });
            }
            
            item.status = 'completed';
            item.progress = 100;
            
            if (item.onComplete) {
                item.onComplete(item.file);
            }
            
        } catch (error) {
            console.error('File processing error:', error);
            item.error = error.message || 'Unknown error';
            item.retries++;
            
            if (item.retries < this.maxRetries) {
                item.status = 'retrying';
                showToast(`⟳ Retrying ${item.file.name} (${item.retries}/${this.maxRetries})`, 'warning');
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, 1000 * item.retries));
            } else {
                item.status = 'failed';
                
                if (item.onError) {
                    item.onError(item.file, item.error);
                }
                
                showToast(`✗ Failed: ${item.file.name} - ${item.error}`, 'error', 5000);
            }
        }
    }

    /**
     * Retry a failed file
     * @param {string} fileId - File ID to retry
     */
    retryFile(fileId) {
        const item = this.queue.find(i => i.id === fileId);
        if (item && item.status === 'failed') {
            item.status = 'pending';
            item.retries = 0;
            item.error = null;
            this.processQueue();
        }
    }

    /**
     * Cancel a file upload
     * @param {string} fileId - File ID to cancel
     */
    cancelFile(fileId) {
        const index = this.queue.findIndex(i => i.id === fileId);
        if (index !== -1) {
            const item = this.queue[index];
            this.queue.splice(index, 1);
            showToast(`Cancelled: ${item.file.name}`, 'info');
        }
    }

    /**
     * Clear all files from queue
     */
    clearQueue() {
        this.queue = [];
        this.processing = false;
        showToast('Queue cleared', 'success');
    }

    /**
     * Get queue status
     * @returns {Object} Queue status
     */
    getStatus() {
        return {
            total: this.queue.length,
            pending: this.queue.filter(i => i.status === 'pending').length,
            processing: this.queue.filter(i => i.status === 'processing').length,
            completed: this.queue.filter(i => i.status === 'completed').length,
            failed: this.queue.filter(i => i.status === 'failed').length,
            queue: this.queue.map(i => ({
                id: i.id,
                fileName: i.file.name,
                status: i.status,
                progress: i.progress,
                retries: i.retries,
                error: i.error
            }))
        };
    }
}

// Singleton instance
export const uploadQueue = new FileUploadQueue();

/**
 * Get formatted file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file validation summary
 * @param {File} file - File to validate
 * @returns {string} HTML summary
 */
export function getFileValidationSummary(file) {
    const size = formatFileSize(file.size);
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const isValid = ['.xlsx', '.xls'].includes(ext);
    
    return `
        <div class="text-xs space-y-1">
            <div class="flex items-center gap-2">
                <i class="ph ph-${isValid ? 'check-circle text-green-600' : 'x-circle text-red-600'}"></i>
                <span>Type: ${ext} ${isValid ? '(Valid)' : '(Invalid)'}</span>
            </div>
            <div class="flex items-center gap-2">
                <i class="ph ph-hard-drives text-slate-400"></i>
                <span>Size: ${size}</span>
            </div>
        </div>
    `;
}
