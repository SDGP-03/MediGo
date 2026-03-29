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
    // Stores drivers currently marked as 'online' and active within the last 5 minutes
    const [onlineDrivers, setOnlineDrivers] = useState<DriverLocation[]>([]);
    
    // Stores drivers currently on a task ('busy') and active within the last 5 minutes
    const [busyDrivers, setBusyDrivers] = useState<DriverLocation[]>([]);
    
    // Stores drivers marked as 'offline' or stale (last seen > 5 minutes ago) but within the last 24 hours
    const [offlineDrivers, setOfflineDrivers] = useState<DriverLocation[]>([]);
    
    // Manages the initial loading state while fetching and processing driver data
    const [isLoading, setIsLoading] = useState(true);
    
    // A counter used to trigger periodic re-calculations of driver status (e.g., checking for staleness)
    const [heartbeat, setHeartbeat] = useState(0);

    // Keeps a stable reference to the latest external driver IDs passed as props
    const externalDriverIdsRef = useRef(externalDriverIds);
    
    // Stores the most recent snapshot of driver location data from Firebase for reuse
    const lastDataRef = useRef<Record<string, any> | null>(null);
    
    // Stores the set of driver IDs belonging to the hospital to filter out irrelevant drivers
    const allowedDriverIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        externalDriverIdsRef.current = externalDriverIds;
    }, [externalDriverIds]);

    // Heartbeat to force re-calculation of "stale" drivers every minute
    useEffect(() => {
        const timer = setInterval(() => {
            setHeartbeat((h) => h + 1);
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let locationUnsub: (() => void) | null = null;
        let hospitalUnsub: (() => void) | null = null;

        const authUnsub = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setOnlineDrivers([]);
                setBusyDrivers([]);
                setOfflineDrivers([]);
                setIsLoading(false);
                return;
            }

            try {
                // 1. Resolve Admin -> HospitalId
                const adminSnap = await get(ref(database, `admin/${user.uid}`));
                const hospitalId: string = adminSnap.val()?.hospitalPlaceId || user.uid;

                // 2. Listen to Hospital's Drivers (Reactive)
                const hospitalDriversRef = ref(database, `hospitals/${hospitalId}/drivers`);
                hospitalUnsub = onValue(hospitalDriversRef, (snap) => {
                    const data = snap.val() || {};
                    allowedDriverIdsRef.current = new Set(Object.keys(data));
                    // Manually trigger a re-process if we already have location data
                    setHeartbeat((h) => h + 1);
                });

                // 3. Listen to Driver Locations
                const locationsRef = ref(database, 'driver_locations');
                locationUnsub = onValue(locationsRef, (snap) => {
                    lastDataRef.current = snap.val();
                    setHeartbeat((h) => h + 1);
                });
            } catch (err) {
                console.error('[DriverLocations] Setup error:', err);
                setIsLoading(false);
            }
        });

        return () => {
            authUnsub();
            if (locationUnsub) locationUnsub();
            if (hospitalUnsub) hospitalUnsub();
        };
    }, []);

    // Process data whenever locations, allowed drivers, or heartbeat changes
    useEffect(() => {
        const data = lastDataRef.current;
        if (!data) {
            if (isLoading) setIsLoading(false);
            return;
        }

        const now = Date.now();
        const extDrivers = new Set(externalDriverIdsRef.current);
        const allowedIds = allowedDriverIdsRef.current;

        const allDrivers: DriverLocation[] = Object.entries(data)
            .filter(([id]) => allowedIds.has(id) || extDrivers.has(id))
            .map(([id, value]: [string, any]) => {
                let rawStatus: string = value.status || (value.isOnline ? 'online' : 'offline');
                const ts = value.timestamp || 0;

                // Stale check (5 min)
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
            .filter((d) => d.lat && d.lng)
            .filter((d) => d.status !== 'offline' || now - d.timestamp < TWENTY_FOUR_HOURS);

        setOnlineDrivers(allDrivers.filter((d) => d.status === 'online'));
        setBusyDrivers(allDrivers.filter((d) => d.status === 'busy'));
        setOfflineDrivers(allDrivers.filter((d) => d.status === 'offline'));
        setIsLoading(false);
    }, [heartbeat]);

    return { onlineDrivers, busyDrivers, offlineDrivers, isLoading };
}
