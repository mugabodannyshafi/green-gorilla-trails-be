import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';

export class ReorderPackageGalleryDto {
  @ApiProperty({
    type: [Number],
    description:
      'Gallery image ids in display order. First id becomes the package cover (featured_image). Must list every gallery image for this package exactly once.',
    example: [12, 48, 51],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  image_ids: number[];
}
