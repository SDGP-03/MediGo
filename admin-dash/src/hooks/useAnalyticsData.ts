import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebase';

// This is the shape of the data our hook will return to the Analytics page
export interface AnalyticsData {
    isLoading: boolean;

    // Top stats cards
    totalRequests: number;
    totalTransfersThisMonth: number;
    activeAmbulances: number;

    // Charts
    incidentTypeData: { name: string; value: number; color: string }[];
    peakHoursData: { label: string; description: string; percent: number; color: string; textColor: string; bgColor: string }[];
    demandAreasData: { area: string; requests: number }[];
    hospitalLoadData: { name: string; percent: number; color: string; borderColor: string }[];
    // Response time trend — one data point per month for the last 6 months
    responseTimeTrend: { month: string; avgTime: number | null }[];
    // Overall average response time in minutes (null if no accepted requests yet)
    avgResponseTimeMinutes: number | null;
}

// Maps priority/reason to a display-friendly incident type
const INCIDENT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

export function useAnalyticsData(): AnalyticsData {
    const [isLoading, setIsLoading] = useState(true);
    const [transfers, setTransfers] = useState<any[]>([]);
    const [activeAmbulances, setActiveAmbulances] = useState(0);

    // --- Fetch transfer_requests from Firebase ---
    useEffect(() => {
        const requestsRef = ref(database, 'transfer_requests');

        const handleData = (snapshot: any) => {
            const data = snapshot.val();
            if (!data) {
                setTransfers([]);
                setIsLoading(false);
                return;
            }
            // Convert the Firebase object (keys → values) into a plain array
            const list = Object.values(data) as any[];
            setTransfers(list);
            setIsLoading(false);
        };

        onValue(requestsRef, handleData);
        return () => off(requestsRef);
    }, []);

    // --- Fetch active driver count from Firebase ---
    useEffect(() => {
        const driversRef = ref(database, 'driver_locations');
        const FIVE_MINUTES = 5 * 60 * 1000;

        const handleDriverData = (snapshot: any) => {
            const data = snapshot.val();
            if (!data) {
                setActiveAmbulances(0);
                return;
            }
            const activeCount = Object.values(data).filter((d: any) =>
                d.isOnline && d.lat && d.lng && (Date.now() - (d.timestamp || 0)) < FIVE_MINUTES
            ).length;
            setActiveAmbulances(activeCount);
        };

        onValue(driversRef, handleDriverData);
        return () => off(driversRef);
    }, []);

    // ----------------------------------------------------------------
    // CALCULATIONS — all computed from the raw `transfers` array
    // ----------------------------------------------------------------

    // 1. Total requests (all time)
    const totalRequests = transfers.length;

    // 2. Transfers this calendar month
    const now = new Date();
    const totalTransfersThisMonth = transfers.filter(t => {
        if (!t.createdAt) return false;
        const d = new Date(t.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // 3. Incident type distribution — grouped by priority
    //    We use "priority" (critical/urgent/standard) as the incident category
    const priorityGroups: Record<string, number> = {};
    transfers.forEach(t => {
        const key = t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : 'Unknown';
        priorityGroups[key] = (priorityGroups[key] || 0) + 1;
    });
    const incidentTypeData = Object.entries(priorityGroups).map(([name, value], i) => ({
        name,
        value,
        color: INCIDENT_COLORS[i % INCIDENT_COLORS.length],
    }));

    // 4. Peak hours — group by hour of day using createdAt timestamp
    const hourBuckets = [0, 0, 0, 0]; // 0-6, 6-9, 9-12, 12-18, 18-24  → actually 4 buckets like the UI
    const bucketDefs = [
        { label: '6-9 AM', description: 'Morning Rush', range: [6, 9], color: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-600 dark:text-blue-400' },
        { label: '9AM-12PM', description: 'Mid Morning', range: [9, 12], color: 'bg-green-50 dark:bg-green-900/20', textColor: 'text-green-600 dark:text-green-400' },
        { label: '12-6 PM', description: 'Afternoon Peak', range: [12, 18], color: 'bg-orange-50 dark:bg-orange-900/20', textColor: 'text-orange-600 dark:text-orange-400' },
        { label: '6PM-12AM', description: 'Evening Rush', range: [18, 24], color: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-600 dark:text-purple-400' },
    ];

    const hourCounts = [0, 0, 0, 0];
    transfers.forEach(t => {
        if (!t.createdAt) return;
        const hour = new Date(t.createdAt).getHours();
        bucketDefs.forEach((bucket, i) => {
            if (hour >= bucket.range[0] && hour < bucket.range[1]) {
                hourCounts[i]++;
            }
        });
    });
    const totalWithTime = hourCounts.reduce((a, b) => a + b, 0) || 1; // prevent divide-by-zero

    const peakHoursData = bucketDefs.map((bucket, i) => ({
        label: bucket.label,
        description: bucket.description,
        percent: Math.round((hourCounts[i] / totalWithTime) * 100),
        color: bucket.color,
        textColor: bucket.textColor,
        bgColor: bucket.color,
    }));

    // 5. High demand areas — grouped by pickup hospital name
    const pickupCounts: Record<string, number> = {};
    transfers.forEach(t => {
        const area = t.pickup?.hospitalName || 'Unknown';
        pickupCounts[area] = (pickupCounts[area] || 0) + 1;
    });
    const demandAreasData = Object.entries(pickupCounts)
        .map(([area, requests]) => ({ area, requests }))
        .sort((a, b) => b.requests - a.requests)
        .slice(0, 5); // top 5

    // 6. Hospital load — grouped by destination hospital
    const destCounts: Record<string, number> = {};
    transfers.forEach(t => {
        const hospital = t.destination?.hospitalName || 'Unknown';
        destCounts[hospital] = (destCounts[hospital] || 0) + 1;
    });
    const maxDest = Math.max(...Object.values(destCounts), 1);
    const BORDER_COLORS = ['border-green-500', 'border-yellow-500', 'border-red-500', 'border-blue-500', 'border-purple-500'];
    const hospitalLoadData = Object.entries(destCounts)
        .map(([name, count], i) => ({
            name,
            percent: Math.round((count / maxDest) * 100),
            color: `bg-${['green', 'yellow', 'red', 'blue', 'purple'][i % 5]}-500`,
            borderColor: BORDER_COLORS[i % BORDER_COLORS.length],
        }))
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 5);

    // 7. Average Response Time Trend — grouped by month (last 6 months)
    //    Response time = acceptedAt - createdAt (in minutes)
    //    Only counted for transfers that have BOTH timestamps
    const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Build the last-6-months labels (oldest → newest)
    const responseTimeTrend: { month: string; avgTime: number | null }[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = MONTH_NAMES[d.getMonth()];

        // Filter transfers accepted in that calendar month
        const monthTransfers = transfers.filter(t => {
            if (!t.createdAt || !t.acceptedAt) return false;
            const created = new Date(t.createdAt);
            return (
                created.getMonth() === d.getMonth() &&
                created.getFullYear() === d.getFullYear()
            );
        });

        if (monthTransfers.length === 0) {
            responseTimeTrend.push({ month: monthLabel, avgTime: null });
        } else {
            const totalMinutes = monthTransfers.reduce((sum, t) => {
                const diffMs = t.acceptedAt - t.createdAt;
                return sum + (diffMs > 0 ? diffMs / 60000 : 0); // convert ms → minutes
            }, 0);
            const avg = totalMinutes / monthTransfers.length;
            responseTimeTrend.push({ month: monthLabel, avgTime: parseFloat(avg.toFixed(1)) });
        }
    }

    // 8. Overall average response time (across all accepted transfers)
    const acceptedTransfers = transfers.filter(
        t => t.createdAt && t.acceptedAt && t.acceptedAt > t.createdAt
    );
    const avgResponseTimeMinutes = acceptedTransfers.length === 0
        ? null
        : parseFloat(
            (
                acceptedTransfers.reduce((sum, t) => sum + (t.acceptedAt - t.createdAt) / 60000, 0)
                / acceptedTransfers.length
            ).toFixed(1)
        );

    return {
        isLoading,
        totalRequests,
        totalTransfersThisMonth,
        activeAmbulances,
        incidentTypeData,
        peakHoursData,
        demandAreasData,
        hospitalLoadData,
        responseTimeTrend,
        avgResponseTimeMinutes,
    };
}
