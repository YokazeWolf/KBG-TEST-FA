import { defineStore } from 'pinia';
import { ZoIUploadService } from '../services/ZoIUpload.service';

export const useMainStore = defineStore('main', {
    state: () => ({
        uploadStatus: '' as 'idle' | 'uploading' | 'success' | 'error',
        uploadError: null as string | null,
        uploadedImageUrl: null as string | null,
    }),
    actions: {
        // Upload ZoI image and analyze with OpenCV (WIP)
        async uploadZoIimage(file: File) {
            this.uploadStatus = 'uploading';
            this.uploadError = null;
            this.uploadedImageUrl = null;

            try {
                const response = await ZoIUploadService.uploadImage(file);
                // Only set uploadedImageUrl if present
                if (response.data.imageUrl) {
                    this.uploadedImageUrl = response.data.imageUrl;
                }
                this.uploadStatus = 'success';

                return response.data;
            } catch (error: any) {
                console.error('Upload error:', error);
                this.uploadError = error.message || 'An error occurred during upload.';
                this.uploadStatus = 'error';
                return null;
            }
        },
        // Check ZoI with CSV (Excel file converted to CSV)
        async checkZoI(file: File) {
            try {
                const response = await ZoIUploadService.checkZoI(file);
                return response.data;
            } catch (error: any) {
                throw error;
            }
        }
    },
});

export default useMainStore;