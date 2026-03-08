/**
 * useDriverLocations — Backend API hook (replaces direct Firebase access)
 *
 * Listens for driver locations via SSE from the NestJS backend.
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
    isOnline: boolean;
}

export function useDriverLocations() {
    const [onlineDrivers, setOnlineDrivers] = useState<DriverLocation[]>([]);
    const [offlineDrivers, setOfflineDrivers] = useState<DriverLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const cleanup = createSSE(
            '/drivers/locations/stream',
            (data) => {
                if (data.online) setOnlineDrivers(data.online);
                if (data.offline) setOfflineDrivers(data.offline);
                setIsLoading(false);
            },
            () => {
                console.warn('[DriverLocations] SSE connection error, reconnecting...');
            },
        );

        return cleanup;
    }, []);

    return { onlineDrivers, offlineDrivers, isLoading };
}
