import { Body, Controller, Get, HttpStatus, HttpCode, Post, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetLoggedInUserId } from 'src/common/decorators/get-logged-in-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { BaseController } from '@rwanda360/rwanda360-service-sdk';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ token: string }> {
    const result = await this.authService.login(dto);

    const expiresIn = this.getTokenExpirationInSeconds();

    response.cookie('access_token', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: expiresIn * 1000,
      path: '/',
    });

    return result;
  }

  @ApiBearerAuth()
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@GetLoggedInUserId() userId: number) {
    return await this.authService.profile(userId);
  }

  private getTokenExpirationInSeconds(): number {
    const expiration = process.env.JWT_EXPIRATION || '7d';

    const match = expiration.match(/^(\d+)([dhms])$/);
    if (!match) return 604800;

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd':
        return value * 86400;
      case 'h':
        return value * 3600;
      case 'm':
        return value * 60;
      case 's':
        return value;
      default:
        return 604800;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset OTP',
    description: "Sends a 6-digit OTP to the user's email for password reset",
  })
  @ApiBody({
    type: ForgotPasswordDto,
    description: 'User email address',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP sent successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'If an account exists with this email, an OTP has been sent',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request or account suspended',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return this.successMessageResponse(
      'If an account exists with this email, an OTP has been sent',
      null,
    );
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify OTP',
    description: "Verifies the OTP sent to user's email",
  })
  @ApiBody({
    type: VerifyOtpDto,
    description: 'Email and OTP',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OTP verified successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'OTP verified successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired OTP',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    await this.authService.verifyOtp(verifyOtpDto);
    return this.successMessageResponse('OTP verified successfully', null);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password',
    description: 'Resets user password using verified OTP',
  })
  @ApiBody({
    type: ResetPasswordDto,
    description: 'Email, OTP, and new password',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
    schema: {
      example: {
        statusCode: 200,
        message: 'Password reset successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid OTP or request',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return this.successMessageResponse('Password reset successfully', null);
  }
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return this.successMessageResponse('Logged out successfully', null);
  }
}
