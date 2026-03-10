/**
 * useDriverLocations — Direct Firebase listener (reverted from NestJS SSE)
 *
 * Listens for driver locations from Firebase Realtime Database.
 */

import { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, onValue, off } from 'firebase/database';

export interface DriverLocation {
    id: string;
    driverName: string;
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
    status: 'online' | 'busy' | 'offline';
}

export function useDriverLocations() {
    const [onlineDrivers, setOnlineDrivers] = useState<DriverLocation[]>([]);
    const [busyDrivers, setBusyDrivers] = useState<DriverLocation[]>([]);
    const [offlineDrivers, setOfflineDrivers] = useState<DriverLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const driversRef = ref(database, 'driver_locations');
        const offsetRef = ref(database, '.info/serverTimeOffset');
        let serverTimeOffset = 0;

        const offsetUnsubscribe = onValue(offsetRef, (snapshot) => {
            serverTimeOffset = snapshot.val() || 0;
        });

        const unsubscribe = onValue(driversRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setOnlineDrivers([]);
                setBusyDrivers([]);
                setOfflineDrivers([]);
                setIsLoading(false);
                return;
            }

            // Use the offset to get the true server time, even if the PC clock is wrong
            const now = Date.now() + serverTimeOffset;
            const TEN_MINUTES = 10 * 60 * 1000;

            const allDrivers: DriverLocation[] = Object.entries(data)
                .map(([id, value]: [string, any]) => {
                    const status = value.status || (value.isOnline ? 'online' : 'offline');

                    // DEBUG: Log the raw Firebase timestamp vs calculated server time
                    console.log(`[DEBUG] Driver ${value.driverName} - Raw Timestamp:`, value.timestamp, new Date(value.timestamp).toISOString());
                    console.log(`[DEBUG] Current Calculated true Google Server Time:`, now, new Date(now).toISOString());
                    console.warn(`[DEBUG] Difference: ${Math.round((now - value.timestamp) / 60000)} minutes`);

                    return {
                        id,
                        driverName: value.driverName || 'Unknown Driver',
                        lat: value.lat,
                        lng: value.lng,
                        accuracy: value.accuracy || 0,
                        timestamp: value.timestamp || 0,
                        status: status as 'online' | 'busy' | 'offline',
                    };
                })
                .filter((d) => d.lat && d.lng);

            // Filter into buckets
            const online = allDrivers.filter(
                (d) => d.status === 'online' && now - d.timestamp < TEN_MINUTES,
            );
            const busy = allDrivers.filter(
                (d) => d.status === 'busy' && now - d.timestamp < TEN_MINUTES,
            );
            const offline = allDrivers.filter(
                (d) => d.status === 'offline' || now - d.timestamp >= TEN_MINUTES,
            );

            setOnlineDrivers(online);
            setBusyDrivers(busy);
            setOfflineDrivers(offline);
            setIsLoading(false);
        }, (error) => {
            console.error('[DriverLocations] Firebase error:', error);
            setIsLoading(false);
        });

        return () => {
            off(driversRef, 'value', unsubscribe);
            off(offsetRef, 'value', offsetUnsubscribe);
        };
    }, []);

    return { onlineDrivers, busyDrivers, offlineDrivers, isLoading };
}
