import {Injectable, OnModuleInit} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import axios, {AxiosInstance} from 'axios';
import {Message, MessageMedia} from 'whatsapp-web.js';

@Injectable()
export class OcrService implements OnModuleInit {
    private httpClient: AxiosInstance;

    constructor(private configService: ConfigService) {
    }

    async onModuleInit(): Promise<any> {
        this.httpClient = axios.create({
            baseURL: this.configService.get<string>('OCR_BASE_URL', 'http://localhost:8080'),
            timeout: 30000
        })
    }

    async extractText(message: Message): Promise<string> {
        try {
            // Check if message has media
            if (!message.hasMedia) {
                throw new Error('Message does not contain media');
            }

            // Download media
            const media = await message.downloadMedia();
            if (!media) {
                throw new Error('Failed to download media');
            }

            // Check if it's an image
            if (!this.isImageMedia(media)) {
                throw new Error(`Unsupported media type: ${media.mimetype}`);
            }

            // Create form data
            const formData = new FormData();

            // Alternative: Create a File object instead of Blob
            const file = new File([Buffer.from(media.data, 'base64')], `image.${this.getFileExtension(media.mimetype)}`, {
                type: media.mimetype
            });
            formData.append('file', file);
            formData.append('version', message.body)
            // Send to OCR service
            const response = await this.httpClient.post('/ocr/image', formData);

            // Extract text from response (adjust based on your API response format)
            return response?.data?.data;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`OCR API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }

    private isImageMedia(media: MessageMedia): boolean {
        const supportedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp'
        ];
        return supportedTypes.includes(media.mimetype);
    }

    private getFileExtension(mimetype: string): string {
        const extensions: { [key: string]: string } = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp'
        };
        return extensions[mimetype] || 'jpg';
    }
}
