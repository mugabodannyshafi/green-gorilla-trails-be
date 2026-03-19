import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { BadRequestException } from '@rwanda360/rwanda360-service-sdk';

@Injectable()
export class EmailService {
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
