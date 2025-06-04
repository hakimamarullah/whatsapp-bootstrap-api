import {Body, Controller, Post, UploadedFiles, UseInterceptors} from '@nestjs/common';
import {MessagingService} from './messaging.service';
import {FilesInterceptor} from '@nestjs/platform-express';
import {ApiBody, ApiConsumes} from '@nestjs/swagger';

@Controller('wa')
export class MessagingController {
    constructor(private readonly whatsappService: MessagingService) {
    }

    @Post('send')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                to: {
                    type: 'string',
                    description: 'Phone number to send the message to',
                },
                message: {
                    type: 'string',
                    description: 'Optional message text',
                },
                files: {
                    type: 'array',
                    items: {
                        type: 'string',
                        format: 'binary',
                    },
                    description: 'Up to 5 optional media files',
                },
            },
            required: ['to'],
        },
    })
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
