import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class HospitalsService {
    private readonly logger = new Logger(HospitalsService.name);
    constructor(private readonly firebaseService: FirebaseService) { }

    async getHospitalAvailability(placeId: string) {
        try {
            const hospitalRef = this.firebaseService.ref(`hospitals/${placeId}`);
            const snapshot = await hospitalRef.get();

            if (!snapshot.exists()) {
                // Not in our registered database
                return { 
                    registered: false, 
                    message: 'Hospital is not registered on the MediGo platform.' 
                };
            }

            const data = snapshot.val();
            // In the database, we store resources as an array or object. 
            // The frontend HospitalDashboard stores them under 'resources'.
            return {
                registered: true,
                hospitalId: placeId,
                name: data.hospitalName || data.name || 'Registered Hospital',
                resources: data.resources || [],
                lastUpdated: data.lastUpdated || Date.now()
            };
        } catch (error) {
            this.logger.error(`Error checking hospital ${placeId}: ${(error as any).message}`);
            throw error;
        }
    }
}
