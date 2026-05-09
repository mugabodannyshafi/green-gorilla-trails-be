import { EntityManager } from 'typeorm';
import * as bcryptjs from 'bcryptjs';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { User } from '../../database/entities/1_user.entity';
import { JwtPayload } from './types/auth.types';
import { DateTime } from 'luxon';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailService } from '../email/email.service';
import { BadRequestException } from '@rwanda360/rwanda360-service-sdk';

@Injectable()
export class AuthService {
  constructor(
    protected readonly entityManager: EntityManager,
    protected readonly configService: ConfigService,
    protected readonly jwtService: JwtService,
    protected readonly emailService: EmailService,
  ) {}

  async login(dto: LoginDto): Promise<{ token: string }> {
    const { email, password } = dto;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.entityManager.findOne(User, {
      where: { email: normalizedEmail },
      select: ['id', 'email', 'password', 'first_name', 'last_name', 'profile_photo_url'],
    });

    if (!user) {
      throw new BadRequestException('These credentials do not match our records.');
    }

    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('These credentials do not match our records.');
    }

    await this.entityManager.update(
      User,
      { id: user.id },
      { last_login_at: DateTime.now().toUnixInteger() },
    );

    const payload: JwtPayload = {
      sub: Number(user.id),
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      token: accessToken,
    };
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
    return await bcryptjs.hash(password, saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcryptjs.compare(password, hash);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    try {
      const user = await this.entityManager.findOne(User, {
        where: { email },
      });

      if (!user) {
        return;
      }

      const otp = this.generateOtp();
      const otpExpiresAt = this.getOtpExpiryTimestamp();

      await this.entityManager.update(
        User,
        { id: user.id },
        {
          otp,
          otp_expires_at: otpExpiresAt,
          otp_attempts: 0,
        },
      );

      await this.emailService.sendOtpEmail(email, otp, user.first_name);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Forgot password error:', error);
      throw new BadRequestException('Failed to process forgot password request');
    }
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  getOtpExpiryTimestamp(): number {
    const otpExpiryMinutes = this.configService.get<number>('OTP_EXPIRY_MINUTES', 10);
    return Math.floor(Date.now() / 1000) + otpExpiryMinutes * 60;
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<void> {
    const { email, otp } = verifyOtpDto;

    try {
      const user = await this.entityManager.findOne(User, {
        where: { email },
      });

      if (!user || !user.otp || !user.otp_expires_at) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      const maxAttempts = this.configService.get<number>('MAX_OTP_ATTEMPTS', 3);
      if (user.otp_attempts >= maxAttempts) {
        await this.entityManager.update(
          User,
          { id: user.id },
          { otp: null, otp_expires_at: null, otp_attempts: 0 },
        );
        throw new BadRequestException('Maximum OTP attempts exceeded. Please request a new OTP.');
      }

      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime > user.otp_expires_at) {
        await this.entityManager.update(
          User,
          { id: user.id },
          { otp: null, otp_expires_at: null, otp_attempts: 0 },
        );
        throw new BadRequestException('OTP has expired. Please request a new one.');
      }

      if (user.otp !== otp) {
        await this.entityManager.update(
          User,
          { id: user.id },
          { otp_attempts: user.otp_attempts + 1 },
        );
        throw new BadRequestException('Invalid OTP');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to verify OTP: ' + error.message);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { email, otp, newPassword } = resetPasswordDto;

    try {
      const user = await this.entityManager.findOne(User, {
        where: { email },
      });

      if (!user || !user.otp || !user.otp_expires_at) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      const currentTime = Math.floor(Date.now() / 1000);
      if (currentTime > user.otp_expires_at) {
        await this.entityManager.update(
          User,
          { id: user.id },
          { otp: null, otp_expires_at: null, otp_attempts: 0 },
        );
        throw new BadRequestException('OTP has expired. Please request a new one.');
      }

      if (user.otp !== otp) {
        throw new BadRequestException('Invalid OTP');
      }

      const hashedPassword = await this.hashPassword(newPassword);

      await this.entityManager.update(
        User,
        { id: user.id },
        {
          password: hashedPassword,
          otp: null,
          otp_expires_at: null,
          otp_attempts: 0,
        },
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to reset password: ' + error.message);
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword, confirmNewPassword } = dto;

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('New password and confirmation do not match');
    }

    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    await this.entityManager.update(User, { id: userId }, { password: hashedPassword });
  }

  async profile(userId: number) {
    const user = await this.entityManager.findOne(User, {
      where: { id: userId },
    });

    return {
      id: Number(user.id),
      email: user.email,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
      full_name: `${user.first_name} ${user.last_name}`,
      profile_photo_url: user.profile_photo_url,
      last_login: DateTime.fromSeconds(user.last_login_at).toFormat('yyyy-LL-dd, HH:mm'),
      date_joined: DateTime.fromSeconds(user.created_at).toFormat('yyyy-LL-dd, HH:mm'),
    };
  }
}
