import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    Sse,
    Req,
    UseGuards,
} from '@nestjs/common';
import { FleetService } from './fleet.service';
import { AuthGuard } from '../auth/auth.guard';
import { Observable } from 'rxjs';

@Controller('fleet')
@UseGuards(AuthGuard)
export class FleetController {
    constructor(private readonly fleetService: FleetService) { }

    /** SSE endpoint — streams ambulances, drivers, pending transfers */
    @Sse('stream')
    streamFleet(@Req() req: any): Observable<MessageEvent> {
        const uid = req.user.uid;
        return this.fleetService.streamFleet(uid);
    }

    // ── Ambulances ──

    @Post('ambulances')
    async addAmbulance(@Req() req: any, @Body() body: any) {
        await this.fleetService.addAmbulance(req.user.uid, body);
        return { success: true };
    }

    @Put('ambulances/:id')
    async updateAmbulance(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: any,
    ) {
        await this.fleetService.updateAmbulance(req.user.uid, id, body);
        return { success: true };
    }

    @Delete('ambulances/:id')
    async deleteAmbulance(@Req() req: any, @Param('id') id: string) {
        await this.fleetService.deleteAmbulance(req.user.uid, id);
        return { success: true };
    }

    // ── Drivers ──

    @Post('drivers')
    async addDriver(@Req() req: any, @Body() body: any) {
        await this.fleetService.addDriver(req.user.uid, body);
        return { success: true };
    }

    @Put('drivers/:id')
    async updateDriver(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: any,
    ) {
        await this.fleetService.updateDriver(req.user.uid, id, body);
        return { success: true };
    }

    @Delete('drivers/:id')
    async deleteDriver(@Req() req: any, @Param('id') id: string) {
        await this.fleetService.deleteDriver(req.user.uid, id);
        return { success: true };
    }

    // ── Assignment helpers ──

    @Post('ambulances/:id/assign')
    async assignToTransfer(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: any,
    ) {
        await this.fleetService.assignAmbulanceToTransfer(req.user.uid, id, body);
        return { success: true };
    }

    @Post('ambulances/:id/maintenance')
    async scheduleMaintenance(
        @Req() req: any,
        @Param('id') id: string,
        @Body() body: { date: string; notes: string },
    ) {
        await this.fleetService.scheduleMaintenance(
            req.user.uid,
            id,
            body.date,
            body.notes,
        );
        return { success: true };
    }

    @Post('ambulances/:id/complete-maintenance')
    async completeMaintenance(@Req() req: any, @Param('id') id: string) {
        await this.fleetService.completeMaintenance(req.user.uid, id);
        return { success: true };
    }

    // ── Pending transfers ──

    @Post('pending-transfers')
    async addPendingTransfer(@Req() req: any, @Body() body: any) {
        return this.fleetService.addPendingTransfer(req.user.uid, body);
    }

    @Delete('pending-transfers/:id')
    async removePendingTransfer(@Req() req: any, @Param('id') id: string) {
        await this.fleetService.removePendingTransfer(req.user.uid, id);
        return { success: true };
    }
}
