import {
    Controller,
    Get,
    Param,
    Sse,
    UseGuards,
    NotFoundException,
    Req,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { AuthGuard } from '../auth/auth.guard';
import { Observable } from 'rxjs';

@Controller('drivers')
@UseGuards(AuthGuard)
export class DriversController {
    constructor(private readonly driversService: DriversService) { }

    /** SSE endpoint — streams online/offline driver locations for the authenticated hospital */
    @Sse('locations/stream')
    streamLocations(@Req() req: any): Observable<MessageEvent> {
        const uid = req.user.uid;
        return this.driversService.streamLocations(uid);
    }

    /** Get a single driver's details by ID */
    @Get(':id')
    async getDriver(@Param('id') id: string) {
        const driver = await this.driversService.getDriverById(id);
        if (!driver) {
            throw new NotFoundException(`Driver ${id} not found`);
        }
        return driver;
    }
}
