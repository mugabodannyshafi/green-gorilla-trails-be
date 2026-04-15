import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { BadRequestException } from '@rwanda360/rwanda360-service-sdk';
import { Booking } from '../../database/entities/14_booking.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    this.resend = new Resend(apiKey);
    this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'onboarding@resend.dev';
  }

  async sendOtpEmail(email: string, otp: string, firstName?: string): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Password Reset OTP',
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
    const contactToEmail = 'mugabodannyshafi@gmail.com';
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
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

  async sendBookingNotificationEmail(booking: Booking): Promise<void> {
    const contactToEmail = 'mugabodannyshafi@gmail.com';
    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
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
        from: this.fromEmail,
        to,
        subject: `Your booking has been updated – Green Gorilla Trails`,
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
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Contact Form - Nextline</title>
  </head>
  <body style="margin:0; padding:24px; font-family: Arial, sans-serif; font-size:15px; color:#0a0c10; line-height:1.5; background-color:#fff;">
    <p style="margin:0 0 8px 0; font-weight:600;">Contact Form – Nextline</p>
    <p style="margin:0 0 20px 0;">You have received a new message from the website contact form.</p>

    <p style="margin:0 0 8px 0; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase;">Details</p>
    <p style="margin:0 0 4px 0;">Name: ${name}</p>
    <p style="margin:0 0 4px 0;">Email: <a href="mailto:${email}" style="color:#4D84F0;">${email}</a></p>
    <p style="margin:0 0 4px 0;">Subject: ${subject}</p>
    <p style="margin:0 0 4px 0;">Message:</p>
    <p style="margin:0 0 20px 0;">${message}</p>

    <p style="margin:24px 0 0 0; font-size:12px; color:#9ca3af;">© ${new Date().getFullYear()} Nextline · Automated message</p>
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
    const name = this.escapeHtml(booking.customer_name);
    const pkgTitle = this.escapeHtml(booking.package?.title ?? `Package #${booking.package_id}`);
    const preferredDate = this.formatBookingTravelDateYyyymmdd(booking.travel_date);
    const status = this.escapeHtml(String(booking.status));
    const message =
      (this.escapeHtml(booking.message).trim() || '—').replace(/\n/g, '<br/>');

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Booking updated</title>
  </head>
  <body style="margin:0; padding:24px; font-family: Georgia, 'Times New Roman', serif; font-size:16px; color:#1a1a1a; line-height:1.6; background-color:#faf9f6;">
    <p style="margin:0 0 8px 0; font-weight:600; color:#005f02;">Green Gorilla Trails</p>
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
    <p style="margin:0; font-size:13px; color:#6b7280;">Thank you for choosing Green Gorilla Trails.</p>
    <p style="margin:24px 0 0 0; font-size:12px; color:#9ca3af;">This is an automated message regarding booking #${booking.id}.</p>
  </body>
</html>`;
  }

  private getBookingEmailTemplate(booking: Booking): string {
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
    <title>New Booking - Nextline</title>
  </head>
  <body style="margin:0; padding:24px; font-family: Arial, sans-serif; font-size:15px; color:#0a0c10; line-height:1.5; background-color:#fff;">
    <p style="margin:0 0 8px 0; font-weight:600;">New Booking Request – Nextline</p>
    <p style="margin:0 0 20px 0;">A new booking request has been submitted from the website.</p>

    <p style="margin:0 0 8px 0; font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase;">Booking Details</p>
    <p style="margin:0 0 4px 0;">Customer: ${booking.customer_name}</p>
    <p style="margin:0 0 4px 0;">Email: <a href="mailto:${booking.email}" style="color:#4D84F0;">${booking.email}</a></p>
    <p style="margin:0 0 4px 0;">Package ID: ${booking.package_id}</p>
    <p style="margin:0 0 4px 0;">Preferred date: ${preferredDate}</p>
    <p style="margin:0 0 4px 0;">Number of days: ${booking.number_of_days}</p>
    <p style="margin:0 0 4px 0;">Number of guests: ${booking.number_of_guests}</p>
    <p style="margin:0 0 4px 0;">Status: ${booking.status}</p>
    <p style="margin:0 0 4px 0;">Message:</p>
    <p style="margin:0 0 20px 0;">${booking.message || '-'}</p>

    <p style="margin:24px 0 0 0; font-size:12px; color:#9ca3af;">© ${new Date().getFullYear()} Nextline · Automated message</p>
  </body>
</html>`;
  }

  private getOtpEmailTemplate(otp: string, firstName?: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Nextline - Password Reset</title>
      </head>
      <body style="margin:0; padding:0; font-family: Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:20px 0;">
                    <h2>Nextline</h2>
                    <h3>Password Reset</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px; text-align:left;">
                    <p>
                      ${firstName ? `Hi ${firstName},` : 'Hi,'}
                    </p>
                    <p>
                      You requested to reset your password. Use the OTP code below to complete the process:
                    </p>
                    <p style="text-align:center; font-weight:bold; letter-spacing:4px; font-size:20px; padding:20px 0;">
                      ${otp}
                    </p>
                    <p>
                      This OTP will expire in 10 minutes.
                    </p>
                    <p>
                      If you didn't request this password reset, please ignore this email or contact Nextline support.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:20px;">
                    <p style="font-size:12px;">
                      © ${new Date().getFullYear()} Nextline. This is an automated email. Please do not reply.
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
