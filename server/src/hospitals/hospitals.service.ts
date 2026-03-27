import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class HospitalsService {
    private readonly logger = new Logger(HospitalsService.name);
    constructor(private readonly firebaseService: FirebaseService) { }

    /**
     * Returns registration status and current resource availability for a hospital.
     * Keyed by Google Place ID (hospitalPlaceId).
     */
    async getHospitalAvailability(placeId: string) {
        try {
            const hospitalRef = this.firebaseService.ref(`hospitals/${placeId}`);
            const snapshot = await hospitalRef.get();

            if (!snapshot.exists()) {
                return {
                    registered: false,
                    message: 'Hospital is not registered on the MediGo platform.'
                };
            }

            const data = snapshot.val();
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

    /**
     * Updates (overwrites) the resources array for a hospital in Firebase.
     * Called from HospitalDashboard when an admin toggles a resource switch.
     */
    async updateHospitalResources(placeId: string, resources: any[]) {
        try {
            // Verify the hospital is registered before writing
            const hospitalRef = this.firebaseService.ref(`hospitals/${placeId}`);
            const snapshot = await hospitalRef.get();

            if (!snapshot.exists()) {
                throw new NotFoundException(`Hospital with placeId "${placeId}" is not registered.`);
            }

            // Write the resources array and stamp the update time
            const resourcesRef = this.firebaseService.ref(`hospitals/${placeId}/resources`);
            await resourcesRef.set(resources);

            const lastUpdatedRef = this.firebaseService.ref(`hospitals/${placeId}/lastUpdated`);
            await lastUpdatedRef.set(Date.now());

            this.logger.log(`Resources updated for hospital ${placeId}`);
            return { success: true, hospitalId: placeId, resources };
        } catch (error) {
            this.logger.error(`Error updating resources for ${placeId}: ${(error as any).message}`);
            throw error;
        }
    }

    /**
     * Returns all transfer requests where this hospital is pickup OR destination.
     * Used by the HospitalDashboard to show TransferRequests per hospital.
     */
    async getHospitalTransferRequests(placeId: string, hospitalName: string) {
        try {
            const transfersRef = this.firebaseService.ref('transfer_requests');
            const snapshot = await transfersRef.get();

            if (!snapshot.exists()) {
                return { placeId, hospitalName, transfers: [] };
            }

            const data = snapshot.val();
            const allTransfers = Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val }));

            // Filter transfers that involve this hospital (by placeId OR hospitalName)
            const relevant = allTransfers.filter(t =>
                t.status !== 'cancelled' &&
                t.status !== 'completed' &&
                (
                    t.pickup?.placeId === placeId ||
                    t.destination?.placeId === placeId ||
                    (hospitalName && (
                        t.pickup?.hospitalName === hospitalName ||
                        t.destination?.hospitalName === hospitalName
                    ))
                )
            );

            return { placeId, hospitalName, transfers: relevant };
        } catch (error) {
            this.logger.error(`Error fetching transfers for hospital ${placeId}: ${(error as any).message}`);
            throw error;
        }
    }
}
