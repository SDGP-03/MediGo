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
    isOnline: boolean;
}

/**
 * Hook to listen for driver locations from Firebase Realtime Database.
 * Automatically filters for online drivers with recent updates (< 5 min).
 */
export function useDriverLocations() {
    const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const driversRef = ref(database, 'driver_locations');

        const handleData = (snapshot: any) => {
            try {
                const data = snapshot.val();
                if (!data) {
                    setDriverLocations([]);
                    setIsLoading(false);
                    return;
                }

                const now = Date.now();
                const FIVE_MINUTES = 5 * 60 * 1000;

                // Convert object to array and filter for online, recent drivers
                const locations: DriverLocation[] = Object.entries(data)
                    .map(([id, value]: [string, any]) => ({
                        id,
                        driverName: value.driverName || 'Unknown Driver',
                        lat: value.lat,
                        lng: value.lng,
                        accuracy: value.accuracy || 0,
                        timestamp: value.timestamp || 0,
                        isOnline: value.isOnline || false,
                    }))
                    .filter(
                        (driver) =>
                            driver.isOnline &&
                            driver.lat &&
                            driver.lng &&
                            now - driver.timestamp < FIVE_MINUTES
                    );

                setDriverLocations(locations);
                setError(null);
            } catch (err) {
                console.error('Error parsing driver locations:', err);
                setError('Failed to parse driver locations');
            } finally {
                setIsLoading(false);
            }
        };

        const handleError = (err: Error) => {
            console.error('Firebase listener error:', err);
            setError('Failed to connect to driver tracking');
            setIsLoading(false);
        };

        // Subscribe to real-time updates
        onValue(driversRef, handleData, handleError);

        // Cleanup on unmount
        return () => {
            off(driversRef);
        };
    }, []);

    return { driverLocations, isLoading, error };
}
