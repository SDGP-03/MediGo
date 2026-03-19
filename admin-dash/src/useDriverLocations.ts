/**
 * useDriverLocations — NestJS SSE listener
 *
 * Listens for driver locations from NestJS backend.
 */

import { useState, useEffect } from 'react';
import { createSSE } from './api/apiClient';

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
        const cleanup = createSSE(
            '/drivers/locations/stream',
            (data: any) => {
                setOnlineDrivers(data.online || []);
                setBusyDrivers(data.busy || []);
                setOfflineDrivers(data.offline || []);
                setIsLoading(false);
            },
            (error) => {
                console.error('[DriverLocations] SSE error:', error);
                setIsLoading(false);
            }
        );

        return () => {
            cleanup();
        };
    }, []);

    return { onlineDrivers, busyDrivers, offlineDrivers, isLoading };
}
