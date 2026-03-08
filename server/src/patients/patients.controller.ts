import {
    Controller,
    Post,
    Put,
    Param,
    Body,
    Sse,
    UseGuards,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { AuthGuard } from '../auth/auth.guard';
import { Observable } from 'rxjs';

@Controller('patients')
@UseGuards(AuthGuard)
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    /** SSE endpoint — streams patient data */
    @Sse('stream')
    streamPatients(): Observable<MessageEvent> {
        return this.patientsService.streamPatients();
    }

    /** Save/update a patient record */
    @Put(':id')
    async savePatient(@Param('id') id: string, @Body() body: any) {
        await this.patientsService.savePatient(id, body);
        return { success: true };
    }

    /** Upload a document for a patient */
    @Post(':id/documents')
    async uploadDocument(@Param('id') id: string, @Body() body: any) {
        await this.patientsService.uploadDocument(id, body);
        return { success: true };
    }
}
