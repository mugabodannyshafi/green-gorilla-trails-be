import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseController } from '@rwanda360/rwanda360-service-sdk';
import { ContactDto } from './dto/contact.dto';
import { EmailService } from './email.service';

@ApiTags('Contact')
@Controller('contact')
export class ContactController extends BaseController {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  @Post()
  @ApiOperation({ summary: 'Send contact form email' })
  @ApiBody({ type: ContactDto, description: 'Contact form fields' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - validation or send failed' })
  async sendContact(@Body() dto: ContactDto) {
    await this.emailService.sendContactEmail(dto.name, dto.email, dto.subject, dto.message);
    return this.successMessageResponse('Message sent successfully');
  }
}
