import {Body, Controller, Post, UploadedFiles, UseInterceptors} from '@nestjs/common';
import {MessagingService} from './messaging.service';
import {FilesInterceptor} from '@nestjs/platform-express';

@Controller('wa')
export class MessagingController {
    constructor(private readonly whatsappService: MessagingService) {
    }

    @Post('send')
    @UseInterceptors(FilesInterceptor('files', 5, {limits: {fileSize: 5 * 1024 * 1024}}))
    async sendMessage(
        @Body() body: { to: string; message?: string },
        @UploadedFiles() files: Array<Express.Multer.File>,
    ): Promise<{ status: string }> {
        const {to, message} = body;
        await this.whatsappService.sendMessage(to, message, files);
        return {status: 'Message sent'};
    }
}
