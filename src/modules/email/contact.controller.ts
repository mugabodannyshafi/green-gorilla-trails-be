import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BaseController, PaginationData } from '@rwanda360/rwanda360-service-sdk';
import { GetPaginationData } from 'src/common/decorators/get-pagination-data.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { ContactDto } from './dto/contact.dto';
import { UpdateContactEnquiryDto } from './dto/update-contact-enquiry.dto';
import { ContactService } from './contact.service';
import {
  ContactEnquiryStatus,
  ContactSubjectKey,
} from '../../database/entities/13_contact_enquiry.entity';

@ApiTags('Contact')
@Controller('contact')
export class ContactController extends BaseController {
  constructor(private readonly contactService: ContactService) {
    super();
  }

  @Post()
  @ApiOperation({ summary: 'Save contact enquiry and send notification email' })
  @ApiBody({ type: ContactDto, description: 'Contact form fields' })
  @ApiResponse({ status: 201, description: 'Message stored and email sent' })
  @ApiResponse({ status: 400, description: 'Bad Request - validation or send failed' })
  async sendContact(@Body() dto: ContactDto) {
    const result = await this.contactService.submit(dto);
    return this.successMessageResponse('Message sent successfully', result);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List contact enquiries (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'perPage', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'query',
    required: false,
    type: String,
    description: 'Search name, email, or subject label',
  })
  @ApiQuery({ name: 'status', required: false, enum: ContactEnquiryStatus })
  @ApiQuery({ name: 'subject_key', required: false, enum: ContactSubjectKey })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async list(
    @GetPaginationData() pagination: PaginationData,
    @Query('status') status?: string,
    @Query('subject_key') subjectKey?: string,
  ) {
    return this.contactService.list(pagination, { status, subjectKey });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a contact enquiry by id (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.contactService.getById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a contact enquiry (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateContactEnquiryDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContactEnquiryDto) {
    return this.contactService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a contact enquiry (admin)' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.contactService.remove(id);
    return this.successMessageResponse('Contact enquiry deleted successfully', { id });
  }
}
