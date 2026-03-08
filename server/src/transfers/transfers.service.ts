import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Observable } from 'rxjs';

@Injectable()
export class TransfersService {
    private readonly logger = new Logger(TransfersService.name);

    constructor(private readonly firebase: FirebaseService) { }

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
    async createTransfer(data: any): Promise<{ id: string }> {
        const transfersRef = this.firebase.ref('transfer_requests');
        const newRef = transfersRef.push();
        await newRef.set({
            ...data,
            createdAt: Date.now(),
            status: 'pending',
        });
        this.logger.log(`Transfer created: ${newRef.key}`);
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
