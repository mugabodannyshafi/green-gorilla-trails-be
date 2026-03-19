import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'CurrentPassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'NewPassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password - must match new password',
    example: 'NewPassword123!',
  })
  @IsString()
  @IsNotEmpty({ message: 'Confirm new password is required' })
  confirmNewPassword: string;
}
