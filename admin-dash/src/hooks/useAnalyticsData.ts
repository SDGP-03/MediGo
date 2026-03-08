/**
 * useAnalyticsData — Backend API hook (replaces direct Firebase access)
 *
 * Fetches aggregated analytics data from the NestJS backend.
 */

import { useState, useEffect } from 'react';
import { apiFetch } from '../api/apiClient';

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
    avgResponseTimeMinutes: number | null;
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
        avgResponseTimeMinutes: null,
        demandAreasData: [],
        incidentTypeData: [],
        hospitalLoadData: [],
        peakHoursData: [],
    });

    useEffect(() => {
        let cancelled = false;

        const fetchData = async () => {
            try {
                const result = await apiFetch('/analytics');
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

        fetchData();

        // Refresh every 30 seconds
        const interval = setInterval(fetchData, 30000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, []);

    return data;
}
