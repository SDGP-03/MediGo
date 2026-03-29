/**
 * useAnalyticsData — Backend API hook (replaces direct Firebase access)
 *
 * Fetches aggregated analytics data from the NestJS backend.
 */

import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiClient';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

// This is the shape of the data our hook will return to the Analytics page
export interface AnalyticsData {
    isLoading: boolean;
    totalRequests: number;
    totalTransfersThisMonth: number;
    activeAmbulances: number;
    monthlyTrend: { month: string; count: number }[];
    statusDistribution: {
        name: string;
        count: number;
        percent: number;
        color: string;
        borderColor: string;
    }[];
    responseTimeTrend: { month: string; avgTime: number | null }[];
    avgResponseTimeSeconds: number | null;
    demandAreasData: { area: string; requests: number }[];
    incidentTypeData: { name: string; value: number; color: string }[];
    hospitalLoadData: { name: string; count: number; percent: number; color: string; borderColor: string; }[];
    peakHoursData: { label: string; description: string; percent: number; color: string; textColor: string; }[];
}

export function useAnalyticsData(): AnalyticsData {
    const [data, setData] = useState<AnalyticsData>({
        isLoading: true,
        totalRequests: 0,
        totalTransfersThisMonth: 0,
        activeAmbulances: 0,
        monthlyTrend: [],
        statusDistribution: [],
        responseTimeTrend: [],
        avgResponseTimeSeconds: null,
        demandAreasData: [],
        incidentTypeData: [],
        hospitalLoadData: [],
        peakHoursData: [],
    });

    useEffect(() => {
        let cancelled = false;
        let interval: NodeJS.Timeout;

        const fetchData = async () => {
            if (!auth.currentUser) return; // safeguard
            try {
                const result = await apiFetch('/analytics');//Calls backend API,This is where:Auth token is used,Backend filtering happens
                if (!cancelled) {
                    setData({ ...result, isLoading: false });
                }
            } catch (error) {
                console.error('[Analytics] Failed to fetch:', error);
                if (!cancelled) {
                    setData((prev) => ({ ...prev, isLoading: false }));
                }
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && !cancelled) {
                fetchData();//Only logged-in users fetch data

                // Clear any existing interval before setting a new one
                if (interval) clearInterval(interval);

                // Refresh every 30 seconds
                interval = setInterval(fetchData, 30000);
            }
        });

        return () => {
            cancelled = true;
            unsubscribe();
            if (interval) clearInterval(interval);
        };
    }, []);

    return data;
}
