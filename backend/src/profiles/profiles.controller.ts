import { Controller, Get, Query } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { FilterDto } from './filter.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  getProfiles(@Query() filter: FilterDto) {
    return this.profilesService.getProfiles(filter);
  }
}
