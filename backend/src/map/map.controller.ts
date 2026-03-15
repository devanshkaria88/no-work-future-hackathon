import { Controller, Get, Query } from '@nestjs/common';
import { MapService } from './map.service';

@Controller('api/map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('bubbles')
  async getBubbles(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radius') radius?: string,
  ) {
    return this.mapService.getBubbles();
  }

  @Get('activity-heatmap')
  async getHeatmap(@Query('borough') borough?: string) {
    return this.mapService.getActivityHeatmap(borough);
  }

  @Get('negotiations/active')
  async getActiveNegotiations() {
    return this.mapService.getActiveNegotiations();
  }
}
