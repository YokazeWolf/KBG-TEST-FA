import axios from 'axios';

export class ZoIUploadService {
    static async uploadImage(file: File): Promise<any> {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post('http://localhost:3005/v1/zoiUpload', formData);

        return response;
    }

    static async checkZoI(file: File): Promise<any> {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post('http://localhost:3005/v1/checkZoI', formData);

        return response;
    }
}