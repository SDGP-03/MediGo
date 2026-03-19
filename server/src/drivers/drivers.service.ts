import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Observable } from 'rxjs';

@Injectable()
export class DriversService {
    private readonly logger = new Logger(DriversService.name);

    constructor(private readonly firebase: FirebaseService) { }

    /** Stream driver locations in real-time (online + offline) for a specific hospital */
    streamLocations(hospitalUid: string): Observable<MessageEvent> {
        return new Observable((subscriber) => {
            const hospitalDriversRef = this.firebase.ref(`hospitals/${hospitalUid}/drivers`);
            const driversRef = this.firebase.ref('driver_locations');

            let allowedDrivers = new Set<string>();
            const hospitalCallback = hospitalDriversRef.on('value', (snap) => {
                const data = snap.val();
                allowedDrivers = new Set(data ? Object.keys(data) : []);
            });


            // Emit immediately so frontend doesn't hang waiting for Firebase
            subscriber.next({
                data: JSON.stringify({ online: [], offline: [] }),
            } as MessageEvent);

            const callback = driversRef.on(
                'value',
                (snapshot) => {
                    const data = snapshot.val();
                    this.logger.debug(`Firebase driver_locations data: ${JSON.stringify(data)}`);
                    if (!data) {
                        subscriber.next({
                            data: JSON.stringify({ online: [], offline: [] }),
                        } as MessageEvent);
                        return;
                    }

                    const now = Date.now();
                    const FIVE_MINUTES = 5 * 60 * 1000;
                    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

                    const allDrivers = Object.entries(data)
                        .filter(([id]) => allowedDrivers.has(id))
                        .map(([id, value]: [string, any]) => {
                            const rawStatus = value.status || (value.isOnline ? 'online' : 'offline');
                            return {
                                id,
                                driverName: value.driverName || 'Unknown Driver',
                                lat: value.lat,
                                lng: value.lng,
                                accuracy: value.accuracy || 0,
                                timestamp: value.timestamp || 0,
                                status: rawStatus,
                            };
                        })
                        .filter((d) => d.lat && d.lng);

                    const online = allDrivers.filter(
                        (d) => d.status === 'online' && now - d.timestamp < FIVE_MINUTES,
                    );
                    const busy = allDrivers.filter(
                        (d) => d.status === 'busy' && now - d.timestamp < FIVE_MINUTES,
                    );
                    const offline = allDrivers.filter(
                        (d) =>
                            d.status === 'offline' ||
                            (d.status !== 'offline' && now - d.timestamp >= FIVE_MINUTES),
                    );

                    subscriber.next({
                        data: JSON.stringify({ online, busy, offline }),
                    } as MessageEvent);
                },
                (error: Error) => {
                    this.logger.error('Driver locations stream error:', error.message);
                    subscriber.error(error);
                },
            );

            return () => {
                driversRef.off('value', callback);
                hospitalDriversRef.off('value', hospitalCallback);
                this.logger.log(`Driver locations SSE stream closed for ${hospitalUid}`);
            };
        });
    }

    /** Get a single driver's details by ID */
    async getDriverById(id: string): Promise<any> {
        const snapshot = await this.firebase.ref(`driver_locations/${id}`).get();
        if (!snapshot.exists()) {
            return null;
        }
        return { id, ...snapshot.val() };
    }
}
