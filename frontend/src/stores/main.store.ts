import { defineStore } from 'pinia';
import { ZoIUploadService } from '../services/ZoIUpload.service';

export const useMainStore = defineStore('main', {
    state: () => ({
        uploadStatus: '' as 'idle' | 'uploading' | 'success' | 'error',
        uploadError: null as string | null,
        uploadedImageUrl: null as string | null,
        useOpenCV: false,
    }),
    actions: {
        // Upload ZoI image to backend (using either OpenCV or compare to CSV)
        async uploadZoIimage(file: File) {
            this.uploadStatus = 'uploading';
            this.uploadError = null;
            this.uploadedImageUrl = null;

            try {
                let response;
                if(this.useOpenCV) {
                    response = await ZoIUploadService.uploadImage(file);
                } else {
                    response = await ZoIUploadService.checkZoI(file);   
                }
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
        // Check ZoI with CSV (Excel file converted to CSV) (deprecated)
        async checkZoI(file: File) {
            try {
                const response = await ZoIUploadService.checkZoI(file);
                return response.data;
            } catch (error: any) {
                throw error;
            }
        },
        // Set OpenCV usage
        setUseOpenCV(useOpenCV: boolean) {
            this.useOpenCV = useOpenCV;
        }
    },
});

export default useMainStore;