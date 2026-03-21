/**
 * useDriverLocations — Direct Firebase listener
 *
 * Reads driver locations directly from Firebase Realtime Database:
 *   driver_locations/${driverId} → { lat, lng, accuracy, timestamp, status, driverName }
 *
 * Only shows drivers that belong to the current hospital
 * (cross-referenced via hospitals/${hospitalId}/drivers).
 *
 * Status logic:
 *   - online  → status === 'online'  AND updated within last 5 min
 *   - busy    → status === 'busy'   AND updated within last 5 min
 *   - offline → status === 'offline' OR last update > 5 min ago
 *              (still shown on map at their LAST KNOWN location, up to 24 h)
 */

import { useState, useEffect, useRef } from 'react';
import { database, auth } from './firebase';
import { ref, onValue, off, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

export interface DriverLocation {
    id: string;
    driverName: string;
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
    status: 'online' | 'busy' | 'offline';
}

const FIVE_MINUTES = 5 * 60 * 1000;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export function useDriverLocations(externalDriverIds: string[] = []) {
    const [onlineDrivers, setOnlineDrivers] = useState<DriverLocation[]>([]);
    const [busyDrivers, setBusyDrivers] = useState<DriverLocation[]>([]);
    const [offlineDrivers, setOfflineDrivers] = useState<DriverLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const externalDriverIdsRef = useRef(externalDriverIds);

    useEffect(() => {
        externalDriverIdsRef.current = externalDriverIds;
    }, [externalDriverIds]);

    useEffect(() => {
        let driversRef: ReturnType<typeof ref> | null = null;
        let cleanupListener: (() => void) | null = null;

        // Step 1: resolve the logged-in admin → hospitalId → allowed driver UIDs
        const authUnsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setOnlineDrivers([]);
                setBusyDrivers([]);
                setOfflineDrivers([]);
                setIsLoading(false);
                return;
            }

            try {
                // Resolve hospitalId (admin may use hospitalPlaceId or fall back to uid)
                const adminSnap = await get(ref(database, `admin/${user.uid}`));
                const adminData = adminSnap.exists() ? adminSnap.val() : {};
                const hospitalId: string = adminData.hospitalPlaceId || user.uid;

                // Fetch the set of driver UIDs that belong to this hospital
                const hospitalDriversSnap = await get(
                    ref(database, `hospitals/${hospitalId}/drivers`)
                );
                const hospitalDriverData = hospitalDriversSnap.exists()
                    ? (hospitalDriversSnap.val() as Record<string, any>)
                    : {};
                const allowedDriverIds = new Set(Object.keys(hospitalDriverData));

                // Step 2: subscribe to driver_locations and filter by hospital
                driversRef = ref(database, 'driver_locations');

                const callback = onValue(
                    driversRef,
                    (snapshot) => {
                        const data = snapshot.val() as Record<string, any> | null;

                        if (!data) {
                            setOnlineDrivers([]);
                            setBusyDrivers([]);
                            setOfflineDrivers([]);
                            setIsLoading(false);
                            return;
                        }

                        const now = Date.now();

                        const extDrivers = new Set(externalDriverIdsRef.current);
                        const allDrivers: DriverLocation[] = Object.entries(data)
                            .filter(([id]) => allowedDriverIds.has(id) || extDrivers.has(id))
                            .map(([id, value]) => {
                                // Normalise status: support legacy isOnline boolean
                                let rawStatus: string =
                                    value.status ||
                                    (value.isOnline ? 'online' : 'offline');

                                // If last update is older than 5 min, force offline
                                const ts: number = value.timestamp || 0;
                                if (rawStatus !== 'offline' && now - ts >= FIVE_MINUTES) {
                                    rawStatus = 'offline';
                                }

                                return {
                                    id,
                                    driverName: value.driverName || 'Unknown Driver',
                                    lat: value.lat,
                                    lng: value.lng,
                                    accuracy: value.accuracy || 0,
                                    timestamp: ts,
                                    status: rawStatus as DriverLocation['status'],
                                };
                            })
                            // Must have valid coordinates; offline drivers still show last location
                            .filter((d) => d.lat && d.lng)
                            // Discard offline drivers older than 24 h (stale)
                            .filter(
                                (d) =>
                                    d.status !== 'offline' ||
                                    now - d.timestamp < TWENTY_FOUR_HOURS
                            );

                        setOnlineDrivers(allDrivers.filter((d) => d.status === 'online'));
                        setBusyDrivers(allDrivers.filter((d) => d.status === 'busy'));
                        setOfflineDrivers(allDrivers.filter((d) => d.status === 'offline'));
                        setIsLoading(false);
                    },
                    (error) => {
                        console.error('[DriverLocations] Firebase error:', error);
                        setIsLoading(false);
                    }
                );

                cleanupListener = () => off(driversRef!, 'value', callback);
            } catch (err) {
                console.error('[DriverLocations] Setup error:', err);
                setIsLoading(false);
            }
        });

        return () => {
            authUnsub();
            cleanupListener?.();
        };
    }, []);

    return { onlineDrivers, busyDrivers, offlineDrivers, isLoading };
}
