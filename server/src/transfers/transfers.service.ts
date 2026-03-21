import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Observable } from 'rxjs';
import axios from 'axios';

interface ActiveTransfer {
    id: string;
    driverId: string;
    destLat?: number;
    destLng?: number;
    destPlaceId?: string;
    destAddress?: string;
}

@Injectable()
export class TransfersService implements OnModuleInit {
    private readonly logger = new Logger(TransfersService.name);
    private activeTransfers = new Map<string, ActiveTransfer>();
    private lastUpdateCache = new Map<string, { lat: number; lng: number; time: number }>();

    constructor(private readonly firebase: FirebaseService) { }

    async onModuleInit() {
        this.logger.log('Initializing Transfer Request listener for Fleet state management...');
        
        // Listen to active transfers for ETA/Distance tracking
        this.firebase.ref('transfer_requests').on('value', async (snapshot) => {
            const data = snapshot.val();
            if (!data) return;
            
            const newActiveTransfers = new Map<string, ActiveTransfer>();
            Object.entries(data).forEach(([key, value]: [string, any]) => {
                const dest = value.destination;
                if (value.status === 'in_progress' && value.driverId && (dest?.lat || dest?.placeId || dest?.address)) {
                    newActiveTransfers.set(value.driverId, {
                        id: key,
                        driverId: value.driverId,
                        destLat: dest.lat,
                        destLng: dest.lng,
                        destPlaceId: dest.placeId,
                        destAddress: dest.address
                    });
                }
            });

            // Trigger immediate calculation for newly discovered active transfers
            for (const [driverId, transfer] of newActiveTransfers) {
                if (!this.activeTransfers.has(driverId)) {
                    this.logger.log(`Initial ETA calculation trigger for transfer ${transfer.id}`);
                    this.triggerEtaUpdate(driverId, transfer);
                }
            }

            this.activeTransfers = newActiveTransfers;
            this.logger.debug(`Tracking ETA for ${this.activeTransfers.size} active drivers`);
        });

        // Listen for driver location changes to calculate ETA for active transfers
        this.firebase.ref('driver_locations').on('child_changed', async (snapshot) => {
            const driverId = snapshot.key;
            const locationData = snapshot.val();
            
            if (!driverId || !locationData || !locationData.lat || !locationData.lng) return;
            
            const activeTransfer = this.activeTransfers.get(driverId);
            if (!activeTransfer) {
                // If busy but not tracked, log it
                if (locationData.status === 'busy') {
                    this.logger.debug(`Driver ${driverId} is busy but no matching active transfer found in status in_progress`);
                }
                return;
            }
            
            const lastCache = this.lastUpdateCache.get(driverId);
            const now = Date.now();
            
            let shouldUpdate = false;
            let reason = '';
            if (!lastCache) {
                shouldUpdate = true;
                reason = 'First location update captured';
            } else {
                const timeDiff = (now - lastCache.time) / 1000;
                const distMoved = this.calculateDistance(lastCache.lat, lastCache.lng, locationData.lat, locationData.lng) * 1000;
                
                // Update if moved > 100 meters OR 60 seconds have passed
                if (timeDiff >= 60) {
                    shouldUpdate = true;
                    reason = `Time elapsed: ${timeDiff.toFixed(1)}s`;
                } else if (distMoved >= 100) {
                    shouldUpdate = true;
                    reason = `Distance moved: ${distMoved.toFixed(1)}m`;
                }
            }
            
            if (shouldUpdate) {
                this.triggerEtaUpdate(driverId!, activeTransfer, locationData);
            }
        });

        // Manage fleet state changes
        this.firebase.ref('transfer_requests').on('child_changed', async (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            const status = data.status;
            const driverId = data.driverId;
            const ambulanceId = data.ambulanceId || data.ambulance;
            const hospitalId = data.hospitalId;

            if (!driverId || !ambulanceId || !hospitalId) return;

            try {
                if (status === 'in_progress') {
                    await this.firebase.ref(`driver_locations/${driverId}`).update({ status: 'busy' });
                    await this.firebase.ref(`hospitals/${hospitalId}/drivers/${driverId}`).update({ status: 'busy' });
                    await this.firebase.ref(`hospitals/${hospitalId}/ambulances/${ambulanceId}`).update({ status: 'on_trip' });
                } else if (status === 'completed' || status === 'cancelled') {
                    await this.firebase.ref(`driver_locations/${driverId}`).update({ status: 'online' });
                    await this.firebase.ref(`hospitals/${hospitalId}/drivers/${driverId}`).update({ status: 'active' });
                    await this.firebase.ref(`hospitals/${hospitalId}/ambulances/${ambulanceId}`).update({ status: 'available' });
                }
            } catch (err: any) {
                this.logger.error(`Failed to update fleet statuses for transfer ${snapshot.key}: ${err.message}`);
            }
        });
    }

    private async triggerEtaUpdate(driverId: string, activeTransfer: ActiveTransfer, locationData?: any) {
        try {
            const now = Date.now();
            
            if (!locationData) {
                const snapshot = await this.firebase.ref(`driver_locations/${driverId}`).get();
                locationData = snapshot.val();
            }

            if (!locationData || !locationData.lat || !locationData.lng) {
                this.logger.debug(`Cannot update ETA for ${driverId}: location not available`);
                return;
            }

            this.lastUpdateCache.set(driverId, { lat: locationData.lat, lng: locationData.lng, time: now });

            const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
            if (!apiKey) {
                this.logger.warn('Google Maps API key is missing (GOOGLE_MAPS_API_KEY)');
                return;
            }

            let destination = '';
            if (activeTransfer.destLat && activeTransfer.destLng) {
                destination = `${activeTransfer.destLat},${activeTransfer.destLng}`;
            } else if (activeTransfer.destPlaceId) {
                destination = `place_id:${activeTransfer.destPlaceId}`;
            } else if (activeTransfer.destAddress) {
                destination = encodeURIComponent(activeTransfer.destAddress);
            }

            if (!destination) return;

            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${locationData.lat},${locationData.lng}&destination=${destination}&key=${apiKey}`;
            const response = await axios.get(url);

            if (response.data.status === 'OK' && response.data.routes[0].legs[0]) {
                const leg = response.data.routes[0].legs[0];
                const distanceStr = leg.distance.text;
                const durationStr = leg.duration.text;

                this.logger.log(`Updated ETA for transfer ${activeTransfer.id}: ${durationStr}, ${distanceStr}`);
                await this.firebase.ref(`transfer_requests/${activeTransfer.id}`).update({
                    eta: durationStr,
                    distance: distanceStr
                });
            } else {
                this.logger.warn(`Directions API returned non-OK status: ${response.data.status} for transfer ${activeTransfer.id}`);
            }
        } catch (error: any) {
            this.logger.error(`Failed to update ETA for driver ${driverId}: ${error.message}`);
        }
    }

    /** Stream all transfer requests in real-time via SSE */
    streamTransfers(): Observable<MessageEvent> {
        return new Observable((subscriber) => {
            const transfersRef = this.firebase.ref('transfer_requests');
            subscriber.next({ data: JSON.stringify({ pending: [], active: [] }) } as MessageEvent);

            const callback = transfersRef.on('value', (snapshot) => {
                const data = snapshot.val();
                if (!data) {
                    subscriber.next({ data: JSON.stringify({ pending: [], active: [] }) } as MessageEvent);
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
                    distance: value.distance || '0 km',
                }));

                const pending = transfers.filter((t) => t.status === 'pending').reverse();
                const active = transfers.filter((t) => t.status && t.status !== 'pending' && t.status !== 'completed' && t.status !== 'cancelled').reverse();

                subscriber.next({ data: JSON.stringify({ pending, active }) } as MessageEvent);
            }, (error: Error) => subscriber.error(error));

            return () => transfersRef.off('value', callback);
        });
    }

    /** Create a new transfer request */
    async createTransfer(uid: string, data: any): Promise<{ id: string }> {
        const adminSnap = await this.firebase.ref(`admin/${uid}`).get();
        const adminData = adminSnap.val() || {};
        const hospitalId: string = adminData.hospitalPlaceId || uid;

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
            hospitalId: hospitalId,
        };

        const newRef = this.firebase.ref('transfer_requests').push();
        await newRef.set(enrichedData);

        const targetDriverId = data.driverId;
        const targetAmbulanceId = data.ambulanceId || data.ambulance;
        if (targetDriverId && targetAmbulanceId && hospitalId) {
            try {
                await Promise.all([
                    this.firebase.ref(`driver_locations/${targetDriverId}`).update({ status: 'assigned' }),
                    this.firebase.ref(`hospitals/${hospitalId}/drivers/${targetDriverId}`).update({ status: 'assigned' }),
                    this.firebase.ref(`hospitals/${hospitalId}/ambulances/${targetAmbulanceId}`).update({ status: 'assigned' })
                ]);
            } catch (err: any) {
                this.logger.error(`Failed to assign for transfer ${newRef.key}: ${err.message}`);
            }
        }

        this.logger.log(`Transfer created: ${newRef.key}`);
        return { id: newRef.key! };
    }

    async getTransfer(id: string): Promise<any> {
        const snapshot = await this.firebase.ref(`transfer_requests/${id}`).get();
        return snapshot.exists() ? { id, ...snapshot.val() } : null;
    }

    async cancelTransfer(id: string): Promise<void> {
        const requestRef = this.firebase.ref(`transfer_requests/${id}`);
        await requestRef.update({
            status: 'cancelled',
            cancelledAt: Date.now(),
            cancelledBy: 'Hospital Admin'
        });
        this.logger.log(`Transfer cancelled: ${id}`);
    }

    async getRawTransfers(): Promise<Record<string, any>> {
        const snapshot = await this.firebase.ref('transfer_requests').get();
        return snapshot.exists() ? snapshot.val() : {};
    }

    private formatTimeAgo(timestamp: any): string {
        if (!timestamp) return 'Just now';
        const ts = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
        const mins = Math.floor((Date.now() - ts) / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} mins ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} hours ago`;
        return `${Math.floor(hours / 24)} days ago`;
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI/180);
    }
}
