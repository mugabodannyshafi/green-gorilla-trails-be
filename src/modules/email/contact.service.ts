import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import { BaseService, PaginationData, PaginationResponse } from '@rwanda360/rwanda360-service-sdk';
import { EntityManager, FindOptionsWhere, Like } from 'typeorm';
import {
  ContactEnquiry,
  ContactEnquiryStatus,
  ContactSubjectKey,
} from '../../database/entities/13_contact_enquiry.entity';
import { ContactDto } from './dto/contact.dto';
import { UpdateContactEnquiryDto } from './dto/update-contact-enquiry.dto';
import { EmailService } from './email.service';

export type SerializedContactEnquiry = {
  id: number;
  name: string;
  email: string;
  subject_key: ContactSubjectKey;
  subject_label: string;
  message: string;
  status: ContactEnquiryStatus;
  created_at: string;
  updated_at: string | null;
};

@Injectable()
export class ContactService extends BaseService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectEntityManager()
    private readonly entityManager: EntityManager,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  private mapSubjectKey(subject: string): ContactSubjectKey {
    const s = subject.trim().toLowerCase();
    if (s.includes('gorilla')) return ContactSubjectKey.GORILLA;
    if (s.includes('safari')) return ContactSubjectKey.SAFARI;
    if (s.includes('group') || s.includes('corporate')) return ContactSubjectKey.GROUP;
    if (s.includes('general')) return ContactSubjectKey.GENERAL;
    return ContactSubjectKey.OTHER;
  }

  private parseStatusFilter(raw?: string): ContactEnquiryStatus | undefined {
    if (raw == null || String(raw).trim() === '') return undefined;
    const v = String(raw).trim().toUpperCase() as ContactEnquiryStatus;
    if (!Object.values(ContactEnquiryStatus).includes(v)) {
      throw new BadRequestException('Invalid status filter');
    }
    return v;
  }

  private parseSubjectKeyFilter(raw?: string): ContactSubjectKey | undefined {
    if (raw == null || String(raw).trim() === '') return undefined;
    const v = String(raw).trim().toUpperCase() as ContactSubjectKey;
    if (!Object.values(ContactSubjectKey).includes(v)) {
      throw new BadRequestException('Invalid subject_key filter');
    }
    return v;
  }

  private extractSearchText(pagination: PaginationData): string {
    const q = pagination.query as string | string[] | undefined;
    if (typeof q === 'string') return q.trim();
    if (Array.isArray(q) && q.length > 0) return String(q[0]).trim();
    return '';
  }

  /** Strip LIKE wildcards from user input for safety */
  private likePattern(search: string): string {
    const cleaned = search.replace(/[%_]/g, '').trim();
    if (!cleaned) return '';
    return `%${cleaned}%`;
  }

  private serialize(e: ContactEnquiry): SerializedContactEnquiry {
    return {
      id: Number(e.id),
      name: e.name,
      email: e.email,
      subject_key: e.subject_key,
      subject_label: e.subject_label,
      message: e.message,
      status: e.status,
      created_at: DateTime.fromSeconds(e.created_at).toFormat('yyyy-LL-dd, HH:mm'),
      updated_at:
        e.updated_at != null
          ? DateTime.fromSeconds(e.updated_at).toFormat('yyyy-LL-dd, HH:mm')
          : null,
    };
  }

  async list(
    pagination: PaginationData,
    filters: { status?: string; subjectKey?: string },
  ): Promise<PaginationResponse> {
    const status = this.parseStatusFilter(filters.status);
    const subjectKey = this.parseSubjectKeyFilter(filters.subjectKey);
    const searchText = this.extractSearchText(pagination);
    const pattern = searchText ? this.likePattern(searchText) : '';

    const base: FindOptionsWhere<ContactEnquiry> = {};
    if (status) base.status = status;
    if (subjectKey) base.subject_key = subjectKey;

    if (pattern) {
      const [rows, total] = await this.entityManager.findAndCount(ContactEnquiry, {
        where: [
          { ...base, name: Like(pattern) },
          { ...base, email: Like(pattern) },
          { ...base, subject_label: Like(pattern) },
        ],
        order: { id: 'DESC' },
        skip: pagination.skip,
        take: pagination.take,
      });
      return this.paginate(
        rows.map((r) => this.serialize(r)),
        total,
        pagination,
      );
    }

    const [rows, total] = await this.entityManager.findAndCount(ContactEnquiry, {
      where: Object.keys(base).length ? base : {},
      order: { id: 'DESC' },
      skip: pagination.skip,
      take: pagination.take,
    });
    return this.paginate(
      rows.map((r) => this.serialize(r)),
      total,
      pagination,
    );
  }

  async getById(id: number): Promise<SerializedContactEnquiry> {
    const e = await this.entityManager.findOne(ContactEnquiry, { where: { id } });
    if (!e) {
      throw new NotFoundException('Contact enquiry not found');
    }
    return this.serialize(e);
  }

  async update(id: number, dto: UpdateContactEnquiryDto): Promise<SerializedContactEnquiry> {
    if (dto.status === undefined) {
      throw new BadRequestException('No fields to update');
    }
    const e = await this.entityManager.findOne(ContactEnquiry, { where: { id } });
    if (!e) {
      throw new NotFoundException('Contact enquiry not found');
    }
    e.status = dto.status;
    const saved = await this.entityManager.save(ContactEnquiry, e);
    return this.serialize(saved);
  }

  async remove(id: number): Promise<void> {
    const result = await this.entityManager.delete(ContactEnquiry, { id });
    if (!result.affected) {
      throw new NotFoundException('Contact enquiry not found');
    }
  }

  async submit(
    dto: ContactDto,
  ): Promise<{ id: number | null; saved: boolean; emailDelivered: boolean }> {
    const name = dto.name.trim();
    const email = dto.email.trim();
    const subjectLabel = dto.subject.trim();
    const message = dto.message.trim();

    await this.emailService.sendContactEmail(name, email, subjectLabel, message);

    await this.emailService.sendContactAcknowledgementEmail(name, email, subjectLabel, message);

    const enquiry = this.entityManager.create(ContactEnquiry, {
      name,
      email,
      subject_key: this.mapSubjectKey(subjectLabel),
      subject_label: subjectLabel,
      message,
      status: ContactEnquiryStatus.NEW,
    });

    try {
      const saved = await this.entityManager.save(ContactEnquiry, enquiry);
      return {
        id: Number(saved.id),
        saved: true,
        emailDelivered: true,
      };
    } catch (err) {
      this.logger.error(
        `Email sent but enquiry not saved: ${err instanceof Error ? err.message : err}`,
      );
      return {
        id: null,
        saved: false,
        emailDelivered: true,
      };
    }
  }
}
