import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { BadRequestException } from '@rwanda360/rwanda360-service-sdk';
import { Booking } from '../../database/entities/14_booking.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  /** Resend `from`: optional display name + verified sender email */
  private readonly fromAddress: string;
  /** Inbox for contact form + new-booking alerts (operations team) */
  private readonly operationsInbox: string;
  /** Shown in HTML templates (replaces hardcoded product name) */
  private readonly brandName: string;

  /** Resend expects `email@domain` or `Name <email@domain>` (quoted name if it contains , ; < > etc.) */
  private static isBareEmail(s: string): boolean {
    return /^[^\s<>"]+@[^\s<>"]+\.[^\s<>"]+$/.test(s);
  }

  private static quoteDisplayNameIfNeeded(name: string): string {
    const n = name.trim();
    if (/[,;<>"\r\n]/.test(n)) {
      return `"${n.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
    return n;
  }

  /**
   * Avoid invalid `Name <Outer <inner>>` when RESEND_FROM_EMAIL already includes angle brackets
   * and MAIL_FROM_NAME is also set.
   */
  private static buildResendFromAddress(rawFromEmail: string, rawDisplayName?: string): string {
    const trimmed = rawFromEmail.trim();
    const displayName = rawDisplayName?.trim();

    const angleMatch = trimmed.match(/^(.+?)\s*<([^>]+)>\s*$/);
    if (angleMatch) {
      const addr = angleMatch[2].trim();
      if (!EmailService.isBareEmail(addr)) {
        throw new Error(
          `RESEND_FROM_EMAIL has invalid address inside <…>: "${addr}". Use a bare address in RESEND_FROM_EMAIL and put the label in MAIL_FROM_NAME.`,
        );
      }
      if (displayName) {
        return `${EmailService.quoteDisplayNameIfNeeded(displayName)} <${addr}>`;
      }
      return trimmed;
    }

    const fallback = trimmed || 'onboarding@resend.dev';
    if (!EmailService.isBareEmail(fallback)) {
      throw new Error(
        `Invalid RESEND_FROM_EMAIL "${fallback}". Use only the address (e.g. noreply@yourdomain.com). Set MAIL_FROM_NAME separately for the inbox display name.`,
      );
    }
    if (!displayName) return fallback;
    return `${EmailService.quoteDisplayNameIfNeeded(displayName)} <${fallback}>`;
  }

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    this.resend = new Resend(apiKey);

    const rawFrom = this.configService.get<string>('RESEND_FROM_EMAIL') ?? 'onboarding@resend.dev';
    const rawName = this.configService.get<string>('MAIL_FROM_NAME');
    this.fromAddress = EmailService.buildResendFromAddress(rawFrom, rawName);
    this.logger.log(`Email "from" resolved to: ${this.redactFromForLog(this.fromAddress)}`);

    this.operationsInbox =
      this.configService.get<string>('MAIL_OPERATIONS_INBOX')?.trim() ||
      this.configService.get<string>('MAIL_ADMIN_INBOX')?.trim() ||
      '';

    this.brandName =
      this.configService.get<string>('MAIL_BRAND_NAME')?.trim() || 'Green Gorilla Trails';

    if (!this.operationsInbox) {
      this.logger.warn(
        'MAIL_OPERATIONS_INBOX (or MAIL_ADMIN_INBOX) is not set; contact and booking admin emails cannot be delivered until configured.',
      );
    }
  }

  /** Log line without breaking PII rules — shows shape only */
  private redactFromForLog(from: string): string {
    const m = from.match(/^(.+)\s<([^>]+)>$/);
    if (m) return `${m[1]} <…@${m[2].split('@')[1] ?? '…'}>`;
    return from.includes('@') ? `…@${from.split('@')[1]}` : from;
  }

  private requireOperationsInbox(): string {
    if (!this.operationsInbox) {
      throw new BadRequestException(
        'Email inbox not configured. Set MAIL_OPERATIONS_INBOX in the environment.',
      );
    }
    return this.operationsInbox;
  }

  async sendOtpEmail(email: string, otp: string, firstName?: string): Promise<void> {
    try {
      const otpSubject =
        this.configService.get<string>('MAIL_OTP_SUBJECT')?.trim() || 'Password Reset OTP';

      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: email,
        subject: otpSubject,
        html: this.getOtpEmailTemplate(otp, firstName),
      });

      if (error) {
        console.error('Resend error:', error);
        throw new BadRequestException('Failed to send OTP email');
      }

      console.log('Email sent successfully:', data);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new BadRequestException('Failed to send OTP email: ' + error.message);
    }
  }

  async sendContactEmail(
    name: string,
    email: string,
    subject: string,
    message: string,
  ): Promise<void> {
    const contactToEmail = this.requireOperationsInbox();
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: contactToEmail,
        subject: `Contact form: ${subject}`,
        html: this.getContactEmailTemplate(name, email, subject, message),
      });

      if (error) {
        console.error('Resend error:', error);
        throw new BadRequestException('Failed to send contact email');
      }

      console.log('Contact email sent successfully:', data);
    } catch (error) {
      console.error('Error sending contact email:', error);
      throw new BadRequestException('Failed to send contact email: ' + error.message);
    }
  }

  /**
   * Customer-facing acknowledgement after a contact form submission.
   * Best-effort: logs and swallows errors so the main flow is never blocked.
   */
  async sendContactAcknowledgementEmail(
    name: string,
    toEmail: string,
    subject: string,
    message: string,
  ): Promise<void> {
    const to = toEmail?.trim();
    if (!to) {
      this.logger.warn('Contact acknowledgement skipped: missing recipient email');
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: `We received your message – ${this.brandName}`,
        html: this.getContactAckTemplate(name, subject, message),
      });

      if (error) {
        this.logger.error(`Resend error (contact ack to ${to}): ${JSON.stringify(error)}`);
        return;
      }

      this.logger.log(`Contact acknowledgement sent to ${to}: ${data?.id ?? 'ok'}`);
    } catch (err) {
      this.logger.error(
        `Failed to send contact acknowledgement to ${to}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  async sendBookingNotificationEmail(booking: Booking): Promise<void> {
    const contactToEmail = this.requireOperationsInbox();
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to: contactToEmail,
        subject: `New Booking Request - ${booking.customer_name}`,
        html: this.getBookingEmailTemplate(booking),
      });

      if (error) {
        console.error('Resend error:', error);
        throw new BadRequestException('Failed to send booking notification email');
      }

      console.log('Booking notification email sent successfully:', data);
    } catch (error) {
      console.error('Error sending booking notification email:', error);
      throw new BadRequestException('Failed to send booking notification email: ' + error.message);
    }
  }

  /**
   * Customer-facing acknowledgement after a new booking is created.
   * Best-effort: logs and swallows errors so the main flow is never blocked.
   */
  async sendBookingAcknowledgementEmail(booking: Booking): Promise<void> {
    const to = booking.email?.trim();
    if (!to) {
      this.logger.warn(`Booking ${booking.id}: no customer email; skip acknowledgement`);
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: `We received your booking request – ${this.brandName}`,
        html: this.getBookingAckTemplate(booking),
      });

      if (error) {
        this.logger.error(
          `Resend error (booking ack #${booking.id}): ${JSON.stringify(error)}`,
        );
        return;
      }

      this.logger.log(
        `Booking acknowledgement sent to ${to} (id ${booking.id}): ${data?.id ?? 'ok'}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to send booking acknowledgement for booking ${booking.id}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  /**
   * Notifies the customer after an admin updates their booking (PATCH).
   * Swallows Resend errors after logging so the API update still succeeds.
   */
  async sendBookingCustomerUpdateEmail(booking: Booking): Promise<void> {
    const to = booking.email?.trim();
    if (!to) {
      this.logger.warn(`Booking ${booking.id}: no customer email; skip update notification`);
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: `Your booking has been updated – ${this.brandName}`,
        html: this.getBookingCustomerUpdateTemplate(booking),
      });

      if (error) {
        this.logger.error(`Resend error (booking update #${booking.id}): ${JSON.stringify(error)}`);
        return;
      }

      this.logger.log(`Booking update email sent to ${to} (id ${booking.id}): ${data?.id ?? 'ok'}`);
    } catch (err) {
      this.logger.error(
        `Failed to send booking update email for booking ${booking.id}`,
        err instanceof Error ? err.stack : err,
      );
    }
  }

  private getContactEmailTemplate(
    name: string,
    email: string,
    subject: string,
    message: string,
  ): string {
    const brand = this.escapeHtml(this.brandName);
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Contact Form - ${brand}</title>
  </head>
  <body style="margin:0; padding:24px; font-family: Arial, sans-serif; font-size:15px; color:#0a0c10; line-height:1.5; background-color:#fff;">
    <p style="margin:0 0 8px 0; font-weight:600;">Contact Form – ${brand}</p>
    <p style="margin:0 0 20px 0;">You have received a new message from the website contact form.</p>

    <p style="margin:0 0 8px 0; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase;">Details</p>
    <p style="margin:0 0 4px 0;">Name: ${name}</p>
    <p style="margin:0 0 4px 0;">Email: <a href="mailto:${email}" style="color:#4D84F0;">${email}</a></p>
    <p style="margin:0 0 4px 0;">Subject: ${subject}</p>
    <p style="margin:0 0 4px 0;">Message:</p>
    <p style="margin:0 0 20px 0;">${message}</p>

    <p style="margin:24px 0 0 0; font-size:12px; color:#9ca3af;">© ${new Date().getFullYear()} ${brand} · Automated message</p>
  </body>
</html>`;
  }

  private getContactAckTemplate(name: string, subject: string, message: string): string {
    const brand = this.escapeHtml(this.brandName);
    const safeName = this.escapeHtml(name?.trim() || 'there');
    const safeSubject = this.escapeHtml(subject?.trim() || 'your enquiry');
    const safeMessage = (this.escapeHtml(message).trim() || '—').replace(/\n/g, '<br/>');

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>We received your message – ${brand}</title>
  </head>
  <body style="margin:0; padding:24px; font-family: Georgia, 'Times New Roman', serif; font-size:16px; color:#1a1a1a; line-height:1.6; background-color:#faf9f6;">
    <p style="margin:0 0 8px 0; font-weight:600; color:#005f02;">${brand}</p>
    <p style="margin:0 0 20px 0;">Hello ${safeName},</p>
    <p style="margin:0 0 20px 0;">Thank you for reaching out to ${brand}. We have received your message and a member of our team will get back to you shortly.</p>

    <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#6b7280; text-transform:uppercase;">Subject</p>
    <p style="margin:0 0 20px 0;">${safeSubject}</p>

    <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#6b7280; text-transform:uppercase;">Your message</p>
    <p style="margin:0 0 24px 0; padding:12px 16px; background:#fff; border:1px solid #e5e7eb; border-radius:8px;">${safeMessage}</p>

    <p style="margin:0 0 12px 0;">If anything changes in the meantime, simply reply to this email.</p>
    <p style="margin:0; font-size:13px; color:#6b7280;">— The ${brand} team</p>
    <p style="margin:24px 0 0 0; font-size:12px; color:#9ca3af;">© ${new Date().getFullYear()} ${brand} · This is an automated confirmation.</p>
  </body>
</html>`;
  }

  private getBookingAckTemplate(booking: Booking): string {
    const brand = this.escapeHtml(this.brandName);
    const name = this.escapeHtml(booking.customer_name?.trim() || 'there');
    const pkgTitle = this.escapeHtml(booking.package?.title ?? `Package #${booking.package_id}`);
    const preferredDate = this.formatBookingTravelDateYyyymmdd(booking.travel_date);
    const status = this.escapeHtml(String(booking.status));
    const message = (this.escapeHtml(booking.message).trim() || '—').replace(/\n/g, '<br/>');

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>We received your booking request – ${brand}</title>
  </head>
  <body style="margin:0; padding:24px; font-family: Georgia, 'Times New Roman', serif; font-size:16px; color:#1a1a1a; line-height:1.6; background-color:#faf9f6;">
    <p style="margin:0 0 8px 0; font-weight:600; color:#005f02;">${brand}</p>
    <p style="margin:0 0 20px 0;">Hello ${name},</p>
    <p style="margin:0 0 20px 0;">Thank you for your booking request with ${brand}. We have received the details below and our team will reach out to you soon to confirm availability and next steps.</p>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px 0; border-collapse:collapse; max-width:520px;">
      <tr><td style="padding:6px 16px 6px 0; color:#6b7280; font-size:13px; vertical-align:top;">Booking reference</td><td style="padding:6px 0; font-weight:500;">#${booking.id}</td></tr>
      <tr><td style="padding:6px 16px 6px 0; color:#6b7280; font-size:13px; vertical-align:top;">Experience</td><td style="padding:6px 0;">${pkgTitle}</td></tr>
      <tr><td style="padding:6px 16px 6px 0; color:#6b7280; font-size:13px; vertical-align:top;">Preferred travel start</td><td style="padding:6px 0;">${preferredDate}</td></tr>
      <tr><td style="padding:6px 16px 6px 0; color:#6b7280; font-size:13px; vertical-align:top;">Trip length</td><td style="padding:6px 0;">${booking.number_of_days} day(s)</td></tr>
      <tr><td style="padding:6px 16px 6px 0; color:#6b7280; font-size:13px; vertical-align:top;">Status</td><td style="padding:6px 0; font-weight:600;">${status}</td></tr>
    </table>

    <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#6b7280; text-transform:uppercase;">Your message</p>
    <p style="margin:0 0 24px 0; padding:12px 16px; background:#fff; border:1px solid #e5e7eb; border-radius:8px;">${message}</p>

    <p style="margin:0 0 12px 0;">If you need to adjust anything, simply reply to this email or contact us through our website.</p>
    <p style="margin:0; font-size:13px; color:#6b7280;">— The ${brand} team</p>
    <p style="margin:24px 0 0 0; font-size:12px; color:#9ca3af;">© ${new Date().getFullYear()} ${brand} · Automated confirmation for booking #${booking.id}.</p>
  </body>
</html>`;
  }

  private escapeHtml(text: string | null | undefined): string {
    if (text == null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private formatBookingTravelDateYyyymmdd(travelDate: number): string {
    if (!Number.isInteger(travelDate)) return 'N/A';
    const y = Math.floor(travelDate / 10000);
    const m = Math.floor((travelDate % 10000) / 100);
    const d = travelDate % 100;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  private getBookingCustomerUpdateTemplate(booking: Booking): string {
    const brand = this.escapeHtml(this.brandName);
    const name = this.escapeHtml(booking.customer_name);
    const pkgTitle = this.escapeHtml(booking.package?.title ?? `Package #${booking.package_id}`);
    const preferredDate = this.formatBookingTravelDateYyyymmdd(booking.travel_date);
    const status = this.escapeHtml(String(booking.status));
    const message = (this.escapeHtml(booking.message).trim() || '—').replace(/\n/g, '<br/>');

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Booking updated</title>
  </head>
  <body style="margin:0; padding:24px; font-family: Georgia, 'Times New Roman', serif; font-size:16px; color:#1a1a1a; line-height:1.6; background-color:#faf9f6;">
    <p style="margin:0 0 8px 0; font-weight:600; color:#005f02;">${brand}</p>
    <p style="margin:0 0 20px 0;">Hello ${name},</p>
    <p style="margin:0 0 20px 0;">We have updated your booking request. Here are the current details:</p>

    <table cellpadding="0" cellspacing="0" style="margin:0 0 24px 0; border-collapse:collapse; max-width:520px;">
      <tr><td style="padding:6px 16px 6px 0; color:#6b7280; font-size:13px; vertical-align:top;">Booking reference</td><td style="padding:6px 0; font-weight:500;">#${booking.id}</td></tr>
      <tr><td style="padding:6px 16px 6px 0; color:#6b7280; font-size:13px; vertical-align:top;">Experience</td><td style="padding:6px 0;">${pkgTitle}</td></tr>
      <tr><td style="padding:6px 16px 6px 0; color:#6b7280; font-size:13px; vertical-align:top;">Preferred travel start</td><td style="padding:6px 0;">${preferredDate}</td></tr>
      <tr><td style="padding:6px 16px 6px 0; color:#6b7280; font-size:13px; vertical-align:top;">Trip length</td><td style="padding:6px 0;">${booking.number_of_days} day(s)</td></tr>
      <tr><td style="padding:6px 16px 6px 0; color:#6b7280; font-size:13px; vertical-align:top;">Status</td><td style="padding:6px 0; font-weight:600;">${status}</td></tr>
    </table>

    <p style="margin:0 0 8px 0; font-size:13px; font-weight:600; color:#6b7280; text-transform:uppercase;">Your message on file</p>
    <p style="margin:0 0 24px 0; padding:12px 16px; background:#fff; border:1px solid #e5e7eb; border-radius:8px;">${message}</p>

    <p style="margin:0 0 12px 0;">If you have any questions, simply reply to this email or contact us through our website.</p>
    <p style="margin:0; font-size:13px; color:#6b7280;">Thank you for choosing ${brand}.</p>
    <p style="margin:24px 0 0 0; font-size:12px; color:#9ca3af;">This is an automated message regarding booking #${booking.id}.</p>
  </body>
</html>`;
  }

  private getBookingEmailTemplate(booking: Booking): string {
    const brand = this.escapeHtml(this.brandName);
    const pkgTitle = this.escapeHtml(booking.package?.title ?? `Package #${booking.package_id}`);
    const customerName = this.escapeHtml(booking.customer_name);
    const customerEmail = this.escapeHtml(booking.email);
    const status = this.escapeHtml(String(booking.status));
    const messageBlock = (this.escapeHtml(booking.message).trim() || '—').replace(/\n/g, '<br/>');
    const preferredDate =
      booking.travel_date && Number.isInteger(booking.travel_date)
        ? `${Math.floor(booking.travel_date / 10000)}-${String(
            Math.floor((booking.travel_date % 10000) / 100),
          ).padStart(2, '0')}-${String(booking.travel_date % 100).padStart(2, '0')}`
        : 'N/A';

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New Booking - ${brand}</title>
  </head>
  <body style="margin:0; padding:24px; font-family: Arial, sans-serif; font-size:15px; color:#0a0c10; line-height:1.5; background-color:#fff;">
    <p style="margin:0 0 8px 0; font-weight:600;">New Booking Request – ${brand}</p>
    <p style="margin:0 0 20px 0;">A new booking request has been submitted from the website.</p>

    <p style="margin:0 0 8px 0; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase;">Booking Details</p>
    <p style="margin:0 0 4px 0;">Customer: ${customerName}</p>
    <p style="margin:0 0 4px 0;">Email: <a href="mailto:${customerEmail}" style="color:#4D84F0;">${customerEmail}</a></p>
    <p style="margin:0 0 4px 0;">Package: <strong>${pkgTitle}</strong></p>
    <p style="margin:0 0 4px 0;">Package ID: ${booking.package_id}</p>
    <p style="margin:0 0 4px 0;">Preferred date: ${preferredDate}</p>
    <p style="margin:0 0 4px 0;">Number of days: ${booking.number_of_days}</p>

    <p style="margin:0 0 4px 0;">Status: ${status}</p>
    <p style="margin:0 0 4px 0;">Message:</p>
    <p style="margin:0 0 20px 0;">${messageBlock}</p>

    <p style="margin:24px 0 0 0; font-size:12px; color:#9ca3af;">© ${new Date().getFullYear()} ${brand} · Automated message</p>
  </body>
</html>`;
  }

  private getOtpEmailTemplate(otp: string, firstName?: string): string {
    const brand = this.escapeHtml(this.brandName);
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${brand} - Password Reset</title>
      </head>
      <body style="margin:0; padding:0; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <h2>${brand}</h2>
                    <h3>Password Reset</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px; text-align:left;">
                    <p>
                      ${firstName ? `Hi ${this.escapeHtml(firstName)},` : 'Hi,'}
                    </p>
                    <p>
                      You requested to reset your password. Use the OTP code below to complete the process:
                    </p>
                    <p style="text-align:center; font-weight:bold; letter-spacing:4px; font-size:20px; padding:20px 0;">
                      ${this.escapeHtml(otp)}
                    </p>
                    <p>
                      This OTP will expire in 10 minutes.
                    </p>
                    <p>
                      If you didn't request this password reset, please ignore this email or contact ${brand} support.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:20px;">
                    <p style="font-size:12px;">
                      © ${new Date().getFullYear()} ${brand}. This is an automated email. Please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
  }
}
