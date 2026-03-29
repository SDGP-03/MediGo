import {
    Controller,
    Post,//requests (saving or updating data)
    Put,
    Param,//grabs the ID from the URL.
    Body,//The data being sent
    Sse,//Server-Sent Events (SSE) is a way for a server to push updates to a client.
    UseGuards,//The security checkpoint.
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { AuthGuard } from '../auth/auth.guard';//make sure only logged-in users get in.
import { Observable } from 'rxjs';//a way to handle streams of data over time.

@Controller('patients')//This is the "Address Label" for this folder.
@UseGuards(AuthGuard)//The security checkpoint.
export class PatientsController {
    constructor(private readonly patientsService: PatientsService) { }

    /** SSE endpoint — streams patient data */
    @Sse('stream')//Once connected, the server keeps pushing new patient data to the dashboard whenever it changes, like a live news ticker.
    streamPatients(): Observable<MessageEvent> {
        return this.patientsService.streamPatients();
    }

    /** Save/update a patient record */
    @Put(':id')//This is the "Update" button.
    async savePatient(@Param('id') id: string, @Body() body: any) {//receives the patient's ID and the new data.
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
