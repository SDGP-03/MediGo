import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Observable } from 'rxjs';

@Injectable()
export class PatientsService {
    private readonly logger = new Logger(PatientsService.name);

    constructor(private readonly firebase: FirebaseService) { }

    /** Stream patient data (from transfer_requests + patient_records) via SSE */
    streamPatients(): Observable<MessageEvent> {
        return new Observable((subscriber) => {
            const transfersRef = this.firebase.ref('transfer_requests');
            const recordsRef = this.firebase.ref('patient_records');

            let transferData: Record<string, any> = {};
            let recordData: Record<string, any> = {};

            const emit = () => {
                subscriber.next({
                    data: JSON.stringify({
                        transferRequests: transferData,
                        patientRecords: recordData,
                    }),
                } as MessageEvent);
            };

            // Emit immediately so frontend does not hang waiting for Firebase
            emit();

            const cbTransfers = transfersRef.on('value', (snap) => {
                transferData = snap.exists() ? snap.val() : {};
                emit();
            });

            const cbRecords = recordsRef.on('value', (snap) => {
                recordData = snap.exists() ? snap.val() : {};
                emit();
            });

            return () => {
                transfersRef.off('value', cbTransfers);
                recordsRef.off('value', cbRecords);
                this.logger.log('Patients SSE stream closed');
            };
        });
    }

    /** Save/update a patient record */
    async savePatient(patientId: string, data: any): Promise<void> {
        const sanitizedKey = patientId.replace(/[.#$[\]]/g, '_');
        await this.firebase.ref(`patient_records/${sanitizedKey}`).set(data);
    }

    /** Upload a document for a patient */
    async uploadDocument(
        patientId: string,
        document: any,
    ): Promise<void> {
        const sanitizedKey = patientId.replace(/[.#$[\]]/g, '_');
        const docsRef = this.firebase.ref(
            `patient_records/${sanitizedKey}/documents`,
        );
        const newRef = docsRef.push();
        await newRef.set(document);
    }
}
