import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('hospitals')
@UseGuards(AuthGuard)
export class HospitalsController {
    constructor(private readonly hospitalsService: HospitalsService) { }

    @Get(':placeId/availability')
    async getAvailability(@Param('placeId') placeId: string) {
        return this.hospitalsService.getHospitalAvailability(placeId);
    }
}
