import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Sse,
    UseGuards,
    NotFoundException,
    Req,
    InternalServerErrorException,
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

    /** Register a new driver */
    @Post()
    async createDriver(@Req() req: any, @Body() driverData: any) {
        try {
            return await this.driversService.createDriver(req.user.uid, driverData);
        } catch (error: any) {
            throw new InternalServerErrorException(error.message);
        }
    }

    /** Update an existing driver's profile */
    @Patch(':id')
    async updateDriver(
        @Req() req: any,
        @Param('id') id: string,
        @Body() changes: any,
    ) {
        try {
            return await this.driversService.updateDriver(req.user.uid, id, changes);
        } catch (error: any) {
            if (error.message.includes('not found')) {
                throw new NotFoundException(error.message);
            }
            throw new InternalServerErrorException(error.message);
        }
    }

    /** Remove a driver profile */
    @Delete(':id')
    async deleteDriver(@Req() req: any, @Param('id') id: string) {
        try {
            return await this.driversService.deleteDriver(req.user.uid, id);
        } catch (error: any) {
            if (error.message.includes('not found')) {
                throw new NotFoundException(error.message);
            }
            throw new InternalServerErrorException(error.message);
        }
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
