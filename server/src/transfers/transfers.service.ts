import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Observable } from 'rxjs';

@Injectable()
export class TransfersService implements OnModuleInit {
    private readonly logger = new Logger(TransfersService.name);

    constructor(private readonly firebase: FirebaseService) { }

    async onModuleInit() {
        this.logger.log('Initializing Transfer Request listener for Fleet state management...');
        
        // Listen to transfer status changes to centrally manage driver/ambulance states
        this.firebase.ref('transfer_requests').on('child_changed', async (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            const status = data.status;
            const driverId = data.driverId;
            const ambulanceId = data.ambulanceId || data.ambulance;
            const hospitalId = data.hospitalId;

            if (!driverId || !ambulanceId || !hospitalId) {
                return;
            }

            try {
                if (status === 'in_progress') {
                    // Driver started navigation
                    await this.firebase.ref(`driver_locations/${driverId}`).update({ status: 'busy' });
                    await this.firebase.ref(`hospitals/${hospitalId}/drivers/${driverId}`).update({ status: 'busy' });
                    await this.firebase.ref(`hospitals/${hospitalId}/ambulances/${ambulanceId}`).update({ status: 'on_trip' });
                } else if (status === 'completed' || status === 'cancelled') {
                    // Trip ended
                    await this.firebase.ref(`driver_locations/${driverId}`).update({ status: 'online' });
                    await this.firebase.ref(`hospitals/${hospitalId}/drivers/${driverId}`).update({ status: 'active' });
                    await this.firebase.ref(`hospitals/${hospitalId}/ambulances/${ambulanceId}`).update({ status: 'available' });
                }
            } catch (err: any) {
                this.logger.error(`Failed to update fleet statuses for transfer ${snapshot.key}: ${err.message}`);
            }
        });
    }

    /** Stream all transfer requests in real-time via SSE */
    streamTransfers(): Observable<MessageEvent> {
        return new Observable((subscriber) => {
            const transfersRef = this.firebase.ref('transfer_requests');

            // Emit an initial empty state immediately so the frontend UI doesn't hang
            subscriber.next({
                data: JSON.stringify({ pending: [], active: [] }),
            } as MessageEvent);

            const callback = transfersRef.on(
                'value',
                (snapshot) => {
                    const data = snapshot.val();
                    if (!data) {
                        subscriber.next({ data: JSON.stringify({ transfers: [] }) } as MessageEvent);
                        return;
                    }

                    const transfers = Object.entries(data).map(([key, value]: [string, any]) => ({
                        id: key.substring(Math.max(0, key.length - 8)).toUpperCase(),
                        realId: key,
                        patient: value.patient?.name || 'Unknown',
                        age: value.patient?.age || 'N/A',
                        gender: value.patient?.gender || 'N/A',
                        from: value.pickup?.hospitalName || 'Unknown',
                        to: value.destination?.hospitalName || 'Unknown',
                        priority: value.priority || 'standard',
                        requestedBy: 'System',
                        time: this.formatTimeAgo(value.createdAt),
                        driverId: value.driverId,
                        destLat: value.destination?.lat,
                        destLng: value.destination?.lng,
                        ambulance: value.ambulanceId || 'Pending',
                        driver: value.driverId || 'Unknown',
                        attendant: value.attendant || 'N/A',
                        status: value.status || 'pending',
                        eta: value.eta || 'Evaluating...',
                        distance: value.distance || '0',
                    }));

                    const pending = transfers
                        .filter((t) => t.status === 'pending')
                        .reverse();
                    const active = transfers
                        .filter((t) => t.status && t.status !== 'pending' && t.status !== 'completed' && t.status !== 'cancelled')
                        .reverse();

                    subscriber.next({
                        data: JSON.stringify({ pending, active }),
                    } as MessageEvent);
                },
                (error: Error) => {
                    this.logger.error('Transfer stream error:', error.message);
                    subscriber.error(error);
                },
            );

            // Cleanup when client disconnects
            return () => {
                transfersRef.off('value', callback);
                this.logger.log('Transfer SSE stream closed');
            };
        });
    }

    /** Create a new transfer request */
    async createTransfer(uid: string, data: any): Promise<{ id: string }> {
        // Resolve admin uid → shared hospitalPlaceId
        const adminSnap = await this.firebase.ref(`admin/${uid}`).get();
        const adminData = adminSnap.val() || {};
        const hospitalId: string = adminData.hospitalPlaceId || uid; // fallback for legacy accounts

        // Read hospital info from the shared hospital node
        const infoSnap = await this.firebase.ref(`hospitals/${hospitalId}/info`).get();
        const hospitalInfo = infoSnap.exists() ? infoSnap.val() : {};

        const enrichedData = {
            ...data,
            pickup: {
                hospitalName: hospitalInfo.name || adminData.hospitalName || 'Unknown Hospital',
                address: hospitalInfo.address || 'Unknown Address',
                lat: hospitalInfo.location?.lat || 0,
                lng: hospitalInfo.location?.lng || 0,
            },
            status: 'pending',
            createdAt: new Date().toISOString(),
            hospitalId: hospitalId, // Store hospitalId for fleet management!
        };

        const transfersRef = this.firebase.ref('transfer_requests');
        const newRef = transfersRef.push();
        await newRef.set(enrichedData);

        // Update driver and ambulance to 'assigned' upon transfer creation
        const targetDriverId = data.driverId;
        const targetAmbulanceId = data.ambulanceId || data.ambulance;
        if (targetDriverId && targetAmbulanceId && hospitalId) {
            try {
                await this.firebase.ref(`driver_locations/${targetDriverId}`).update({ status: 'assigned' });
                await this.firebase.ref(`hospitals/${hospitalId}/drivers/${targetDriverId}`).update({ status: 'assigned' });
                await this.firebase.ref(`hospitals/${hospitalId}/ambulances/${targetAmbulanceId}`).update({ status: 'assigned' });
            } catch (err: any) {
                this.logger.error(`Failed to assign driver/ambulance for transfer ${newRef.key}: ${err.message}`);
            }
        }

        this.logger.log(`Transfer created: ${newRef.key} by hospital: ${enrichedData.pickup.hospitalName} (${hospitalId})`);
        return { id: newRef.key! };
    }

    /** Get a single transfer by ID */
    async getTransfer(id: string): Promise<any> {
        const snapshot = await this.firebase.ref(`transfer_requests/${id}`).get();
        if (!snapshot.exists()) {
            return null;
        }
        return { id, ...snapshot.val() };
    }

    /** Cancel a transfer request */
    async cancelTransfer(id: string): Promise<void> {
        const requestRef = this.firebase.ref(`transfer_requests/${id}`);
        const snapshot = await requestRef.get();
        if (!snapshot.exists()) {
            throw new Error(`Transfer ${id} not found`);
        }
        await requestRef.update({
            status: 'cancelled',
            cancelledAt: Date.now(),
            cancelledBy: 'Hospital Admin'
        });
        this.logger.log(`Transfer cancelled: ${id}`);
    }

    /** Get raw transfer requests data (for patient records) */
    async getRawTransfers(): Promise<Record<string, any>> {
        const snapshot = await this.firebase.ref('transfer_requests').get();
        return snapshot.exists() ? snapshot.val() : {};
    }

    private formatTimeAgo(timestamp: number): string {
        if (!timestamp) return 'Just now';
        const mins = Math.floor((Date.now() - timestamp) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} mins ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} hours ago`;
        return `${Math.floor(hours / 24)} days ago`;
    }
}
