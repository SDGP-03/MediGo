import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

const INCIDENT_COLORS = [
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#a855f7', '#ec4899',
];

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(private readonly firebase: FirebaseService) { }

    /** Get aggregated analytics data */
    async getAnalytics(uid: string): Promise<any> {
        this.logger.log(`Starting getAnalytics() calculation for uid: ${uid}...`);

        // Resolve admin uid → shared hospitalPlaceId
        const adminSnap = await this.firebase.ref(`admin/${uid}`).get();
        const adminData = adminSnap.val() || {};
        const hospitalId: string = adminData.hospitalPlaceId || uid;

        // Read hospital info from the shared hospital node
        const infoSnap = await this.firebase.ref(`hospitals/${hospitalId}/info`).get();
        const hospitalInfo = infoSnap.exists() ? infoSnap.val() : {};
        const hospitalName = hospitalInfo.name || adminData.hospitalName || 'Your Hospital';

        const [transferSnap, driverSnap, hospitalDriversSnap] = await Promise.all([
            this.firebase.ref('transfer_requests').get(),
            this.firebase.ref('driver_locations').get(),
            this.firebase.ref(`hospitals/${hospitalId}/drivers`).get(),
        ]);
        this.logger.log('Firebase fetch complete.');

        let allTransfers: any[] = transferSnap.exists()
            ? Object.values(transferSnap.val())
            : [];

        // Filter transfers: initiated by this hospital OR destination is this hospital
        const transfers = allTransfers.filter(
            (t: any) =>
                t.hospitalId === hospitalId ||
                t.destination?.placeId === hospitalId ||
                t.pickup?.hospitalName === hospitalName ||
                t.destination?.hospitalName === hospitalName
        );

        const driverLocations = driverSnap.exists() ? driverSnap.val() : {};
        const hospitalDrivers = hospitalDriversSnap.exists() ? hospitalDriversSnap.val() : {};
        const hospitalDriverIds = Object.keys(hospitalDrivers);

        this.logger.log(`Fetched ${transfers.length} relevant transfers for ${hospitalName}.`);

        // Total requests
        const totalRequests = transfers.length;

        // Transfers this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const transfersThisMonth = transfers.filter(
            (t: any) => {
                const createdTs = t.createdAt ? new Date(t.createdAt).getTime() : 0;
                return createdTs >= startOfMonth;
            }
        ).length;

        // Active ambulances (drivers online belonging to this hospital)
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        const activeAmbulances = hospitalDriverIds.filter(id => {
            const loc = driverLocations[id];
            return loc && (loc.isOnline || loc.status === 'online' || loc.status === 'busy') && (loc.timestamp || 0) > fiveMinutesAgo;
        }).length;

        // Status distribution
        const statusMap: Record<string, number> = {};
        transfers.forEach((t: any) => {
            const s = t.status || 'unknown';
            statusMap[s] = (statusMap[s] || 0) + 1;
        });

        const statusDistribution = Object.entries(statusMap).map(
            ([name, count], i) => ({
                name: name.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
                count,
                percent: totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0,
                color: INCIDENT_COLORS[i % INCIDENT_COLORS.length],
                borderColor: INCIDENT_COLORS[i % INCIDENT_COLORS.length],
            }),
        );

        // Monthly trend — last 6 months
        const monthlyTrend: { month: string; count: number }[] = [];
        const responseTimeTrend: { month: string; avgTime: number | null }[] = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthStart = d.getTime();
            const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
            const label = d.toLocaleString('default', { month: 'short' });

            const monthTransfers = transfers.filter((t: any) => {
                const ts = t.createdAt ? new Date(t.createdAt).getTime() : 0;
                return ts >= monthStart && ts <= monthEnd;
            });

            monthlyTrend.push({ month: label, count: monthTransfers.length });

            // Real response time calculation (AcceptedAt - CreatedAt)
            const transfersWithResponse = monthTransfers.filter(t => t.acceptedAt && t.createdAt);
            if (transfersWithResponse.length > 0) {
                const totalResponseTimeMs = transfersWithResponse.reduce((sum, t) => {
                    const createdTs = new Date(t.createdAt).getTime();
                    const acceptedTs = t.acceptedAt; // Firebase timestamp
                    return sum + (acceptedTs - createdTs);
                }, 0);
                const avgMinutes = Math.round((totalResponseTimeMs / transfersWithResponse.length) / 60000);
                responseTimeTrend.push({ month: label, avgTime: Math.max(0, avgMinutes) });
            } else {
                responseTimeTrend.push({ month: label, avgTime: null });
            }
        }

        // Average response time across all time (filtered)
        const allTransfersWithResponse = transfers.filter(t => t.acceptedAt && t.createdAt);
        const avgResponseTimeMinutes = allTransfersWithResponse.length > 0
            ? Math.round(
                allTransfersWithResponse.reduce((sum, t) => {
                    const createdTs = new Date(t.createdAt).getTime();
                    const acceptedTs = t.acceptedAt;
                    return sum + (acceptedTs - createdTs);
                }, 0) / allTransfersWithResponse.length / 60000
            )
            : null;

        // Incident Types (Priority Breakdown)
        const priorityMap: Record<string, number> = {};
        transfers.forEach((t: any) => {
            const p = t.priority || 'standard';
            priorityMap[p] = (priorityMap[p] || 0) + 1;
        });
        const colorsMap: Record<string, string> = {
            critical: '#ef4444',
            urgent: '#f97316',
            standard: '#22c55e',
        };
        const incidentTypeData = Object.entries(priorityMap).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: colorsMap[name.toLowerCase()] || '#8884d8',
        }));

        // Peak Hours
        const hoursMap: Record<string, number> = {
            '00-06': 0, '06-12': 0, '12-18': 0, '18-24': 0,
        };
        transfers.forEach((t: any) => {
            if (!t.createdAt) return;
            const hour = new Date(t.createdAt).getHours();
            if (hour >= 0 && hour < 6) hoursMap['00-06']++;
            else if (hour >= 6 && hour < 12) hoursMap['06-12']++;
            else if (hour >= 12 && hour < 18) hoursMap['12-18']++;
            else hoursMap['18-24']++;
        });
        const peakHoursData = [
            {
                label: 'Morning (6 AM - 12 PM)',
                description: 'Start of the day transfers',
                percent: totalRequests ? Math.round((hoursMap['06-12'] / totalRequests) * 100) : 0,
                color: 'bg-blue-50 dark:bg-blue-900/20',
                textColor: 'text-blue-700 dark:text-blue-400',
            },
            {
                label: 'Afternoon (12 PM - 6 PM)',
                description: 'Peak daytime activity',
                percent: totalRequests ? Math.round((hoursMap['12-18'] / totalRequests) * 100) : 0,
                color: 'bg-orange-50 dark:bg-orange-900/20',
                textColor: 'text-orange-700 dark:text-orange-400',
            },
            {
                label: 'Night (6 PM - 12 AM)',
                description: 'Evening emergencies',
                percent: totalRequests ? Math.round((hoursMap['18-24'] / totalRequests) * 100) : 0,
                color: 'bg-purple-50 dark:bg-purple-900/20',
                textColor: 'text-purple-700 dark:text-purple-400',
            },
        ];

        // Demand Areas (Destinations where this hospital sent patients)
        const destMap: Record<string, number> = {};
        transfers.filter(t => t.hospitalId === hospitalId).forEach((t: any) => {
            const dest = t.destination?.hospitalName;
            if (dest) destMap[dest] = (destMap[dest] || 0) + 1;
        });
        const demandAreasData = Object.entries(destMap)
            .map(([area, requests]) => ({ area, requests }))
            .sort((a, b) => b.requests - a.requests)
            .slice(0, 5);

        // Hospital Load (Senders who sent patients to this hospital)
        const fromMap: Record<string, number> = {};
        transfers.filter(t => t.destination?.placeId === hospitalId || t.destination?.hospitalName === hospitalName).forEach((t: any) => {
            const sender = t.pickup?.hospitalName;
            if (sender) fromMap[sender] = (fromMap[sender] || 0) + 1;
        });
        const sortedHospitals = Object.entries(fromMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
        const maxCount = sortedHospitals[0]?.count || 1;
        const hospitalColors = [
            { c: 'bg-red-500', bc: 'border-red-500' },
            { c: 'bg-orange-500', bc: 'border-orange-500' },
            { c: 'bg-blue-500', bc: 'border-blue-500' },
        ];
        const hospitalLoadData = sortedHospitals.map((h, i) => ({
            name: h.name,
            count: h.count,
            percent: Math.round((h.count / maxCount) * 100),
            color: hospitalColors[i]?.c || 'bg-gray-500',
            borderColor: hospitalColors[i]?.bc || 'border-gray-500',
        }));

        this.logger.log('Finished getAnalytics() calculation.');

        return {
            isLoading: false,
            totalRequests,
            totalTransfersThisMonth: transfersThisMonth,
            activeAmbulances,
            monthlyTrend,
            statusDistribution,
            responseTimeTrend,
            avgResponseTimeMinutes,
            incidentTypeData,
            peakHoursData,
            demandAreasData,
            hospitalLoadData,
        };
    }
}
