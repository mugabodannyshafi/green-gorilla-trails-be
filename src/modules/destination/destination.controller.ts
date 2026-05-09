import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BaseController } from '@rwanda360/rwanda360-service-sdk';
import { DestinationService } from './destination.service';

@ApiTags('Destinations')
@Controller('destinations')
export class DestinationController extends BaseController {
  constructor(private readonly destinationService: DestinationService) {
    super();
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get active destinations' })
  @ApiResponse({ status: 200, description: 'Destinations retrieved successfully' })
  async listActiveDestinations() {
    return await this.destinationService.listActiveDestinations();
  }
}
