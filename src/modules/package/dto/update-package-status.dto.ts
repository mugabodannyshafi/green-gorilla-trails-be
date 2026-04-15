import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { PackageStatus } from '../../../database/entities/2_package.entity';

export class UpdatePackageStatusDto {
  @ApiProperty({ enum: PackageStatus, description: 'Publication status' })
  @IsEnum(PackageStatus)
  status: PackageStatus;
}
