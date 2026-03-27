import { Controller, Get, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('hospitals')
@UseGuards(AuthGuard)
export class HospitalsController {
    constructor(private readonly hospitalsService: HospitalsService) { }

    /**
     * GET /hospitals/:placeId/availability
     * Returns registration status + live resource availability for the given hospital.
     * Called by TransferRequest.tsx when the user picks a destination hospital.
     */
    @Get(':placeId/availability')
    async getAvailability(@Param('placeId') placeId: string) {
        return this.hospitalsService.getHospitalAvailability(placeId);
    }

    /**
     * PATCH /hospitals/:placeId/resources
     * Body: { resources: Array<{ id, name, available }> }
     * Persists updated resource availability to Firebase under hospitals/{placeId}/resources.
     * Called by HospitalDashboard.tsx when an admin toggles a resource switch.
     */
    @Patch(':placeId/resources')
    async updateResources(
        @Param('placeId') placeId: string,
        @Body('resources') resources: any[],
    ) {
        return this.hospitalsService.updateHospitalResources(placeId, resources);
    }

    /**
     * GET /hospitals/:placeId/transfers?hospitalName=...
     * Returns all active transfer_requests that involve this hospital (pickup or destination).
     * Enables the HospitalDashboard to show per-hospital transfer activity.
     */
    @Get(':placeId/transfers')
    async getTransfers(
        @Param('placeId') placeId: string,
        @Query('hospitalName') hospitalName: string = '',
    ) {
        return this.hospitalsService.getHospitalTransferRequests(placeId, hospitalName);
    }
}
