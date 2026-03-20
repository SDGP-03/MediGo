import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Patch,
    Sse,
    UseGuards,
    NotFoundException,
    HttpCode,
    Req,
} from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { AuthGuard } from '../auth/auth.guard';
import { Observable } from 'rxjs';

@Controller('transfers')
@UseGuards(AuthGuard)
export class TransfersController {
    constructor(private readonly transfersService: TransfersService) { }

    /** SSE endpoint — streams pending + active transfers in real-time */
    @Sse('stream')
    streamTransfers(): Observable<MessageEvent> {
        return this.transfersService.streamTransfers();
    }

    /** Create a new transfer request */
    @Post()
    async createTransfer(@Req() req: any, @Body() body: any) {
        return this.transfersService.createTransfer(req.user.uid, body);
    }

    /** Get a single transfer by its Firebase key */
    @Get(':id')
    async getTransfer(@Param('id') id: string) {
        const transfer = await this.transfersService.getTransfer(id);
        if (!transfer) {
            throw new NotFoundException(`Transfer ${id} not found`);
        }
        return transfer;
    }

    /** Cancel a transfer request */
    @Patch(':id/cancel')
    @HttpCode(204)
    async cancelTransfer(@Param('id') id: string) {
        return this.transfersService.cancelTransfer(id);
    }
}
