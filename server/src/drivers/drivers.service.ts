import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Observable } from 'rxjs';

@Injectable()
export class DriversService {
    private readonly logger = new Logger(DriversService.name);

    constructor(private readonly firebase: FirebaseService) { }

    /** Stream driver locations in real-time (online + offline) */
    streamLocations(): Observable<MessageEvent> {
        return new Observable((subscriber) => {
            const driversRef = this.firebase.ref('driver_locations');

            // Emit immediately so frontend doesn't hang waiting for Firebase
            subscriber.next({
                data: JSON.stringify({ online: [], offline: [] }),
            } as MessageEvent);

            const callback = driversRef.on(
                'value',
                (snapshot) => {
                    const data = snapshot.val();
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
                        .map(([id, value]: [string, any]) => ({
                            id,
                            driverName: value.driverName || 'Unknown Driver',
                            lat: value.lat,
                            lng: value.lng,
                            accuracy: value.accuracy || 0,
                            timestamp: value.timestamp || 0,
                            isOnline: value.isOnline || false,
                        }))
                        .filter((d) => d.lat && d.lng);

                    const online = allDrivers.filter(
                        (d) => d.isOnline && now - d.timestamp < FIVE_MINUTES,
                    );
                    const offline = allDrivers.filter(
                        (d) =>
                            (!d.isOnline || now - d.timestamp >= FIVE_MINUTES) &&
                            now - d.timestamp < TWENTY_FOUR_HOURS,
                    );

                    subscriber.next({
                        data: JSON.stringify({ online, offline }),
                    } as MessageEvent);
                },
                (error: Error) => {
                    this.logger.error('Driver locations stream error:', error.message);
                    subscriber.error(error);
                },
            );

            return () => {
                driversRef.off('value', callback);
                this.logger.log('Driver locations SSE stream closed');
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
