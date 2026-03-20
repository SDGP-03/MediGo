/**
 * useFleetData — Direct Firebase hook (reverted from NestJS)
 */

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, database } from '../firebase';
import { ref, onValue, off, push, update, remove, set } from 'firebase/database';
import { apiPost } from '../api/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AmbulanceStatus = 'available' | 'in_service' | 'maintenance';

export interface AmbulanceUnit {
    id: string;
    status: AmbulanceStatus;
    driver: string;
    driverGender: string;
    attendant: string;
    attendantGender: string;
    location: string;
    lastService?: string;
    nextServiceDue?: string;
    maintenanceNotes?: string;
    currentTransfer?: string;
    etaMinutes?: number;
    equipment: string[];
    hasDoctor: boolean;
    hasVentilator: boolean;
    mileage?: number;
    year?: number;
    fuelConsumed?: number;
    monthlyFuelData?: { [month: string]: number };
}

export type DriverStatus = 'active' | 'off_duty' | 'on_leave';

export interface Driver {
    id: string;
    name: string;
    gender: 'Male' | 'Female' | 'Other';
    phone: string;
    email: string;
    licenseNumber: string;
    licenseExpiry: string;
    joinDate: string;
    status: DriverStatus;
    assignedAmbulance: string | null;
    rating: number;
    totalTrips: number;
    totalKm: number;
    avgResponseTime: string;
    incidentReports: number;
    baseSalary: number;
    overtimeHours: number;
    overtimeRate: number;
    tripsBonus: number;
    attendanceDays: number;
    leaveDays: number;
    fuelEfficiencyScore: number;
}

export interface PendingTransfer {
    id: string;
    patient: string;
    from: string;
    to: string;
    priority: 'critical' | 'urgent' | 'standard';
}

function normalizeDriver(id: string, raw: any): Driver {
    const safeNumber = (v: any, fallback = 0) => {
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) ? n : fallback;
    };

    const statusFromRaw = (v: any): DriverStatus => {
        if (v === 'active' || v === 'off_duty' || v === 'on_leave') return v;
        if (v === 'blocked') return 'off_duty';
        return 'active';
    };

    return {
        id,
        name: (raw?.name ?? raw?.driverName ?? 'Unknown Driver').toString(),
        gender: (raw?.gender === 'Male' || raw?.gender === 'Female' || raw?.gender === 'Other')
            ? raw.gender
            : 'Other',
        phone: (raw?.phone ?? '').toString(),
        email: (raw?.email ?? '').toString(),
        licenseNumber: (raw?.licenseNumber ?? '').toString(),
        licenseExpiry: (raw?.licenseExpiry ?? '').toString(),
        joinDate: (raw?.joinDate ?? '').toString(),
        status: statusFromRaw(raw?.status ?? raw?.blockStatus),
        assignedAmbulance: raw?.assignedAmbulance ?? null,
        rating: safeNumber(raw?.rating, 0),
        totalTrips: safeNumber(raw?.totalTrips, 0),
        totalKm: safeNumber(raw?.totalKm, 0),
        avgResponseTime: (raw?.avgResponseTime ?? 'N/A').toString(),
        incidentReports: safeNumber(raw?.incidentReports, 0),
        baseSalary: safeNumber(raw?.baseSalary, 0),
        overtimeHours: safeNumber(raw?.overtimeHours, 0),
        overtimeRate: safeNumber(raw?.overtimeRate, 0),
        tripsBonus: safeNumber(raw?.tripsBonus, 0),
        attendanceDays: safeNumber(raw?.attendanceDays, 0),
        leaveDays: safeNumber(raw?.leaveDays, 0),
        fuelEfficiencyScore: safeNumber(raw?.fuelEfficiencyScore, 0),
    };
}

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseFleetDataReturn {
    ambulances: AmbulanceUnit[];
    drivers: Driver[];
    pendingTransfers: PendingTransfer[];
    loading: boolean;
    error: string | null;
    hospitalName: string;

    addAmbulance: (unit: AmbulanceUnit) => Promise<void>;
    updateAmbulance: (id: string, changes: Partial<AmbulanceUnit>) => Promise<void>;
    deleteAmbulance: (id: string) => Promise<void>;

    addDriver: (driver: Driver) => Promise<void>;
    updateDriver: (id: string, changes: Partial<Driver>) => Promise<void>;
    deleteDriver: (id: string) => Promise<void>;

    assignAmbulanceToTransfer: (ambId: string, transfer: PendingTransfer) => Promise<void>;
    scheduleMaintenance: (ambId: string, date: string, notes: string) => Promise<void>;
    completeMaintenance: (ambId: string) => Promise<void>;

    addPendingTransfer: (transfer: Omit<PendingTransfer, 'id'>) => Promise<void>;
    removePendingTransfer: (id: string) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFleetData(): UseFleetDataReturn {
    const [uid, setUid] = useState<string | null>(null);
    const [hospitalId, setHospitalId] = useState<string | null>(null);
    const [authResolved, setAuthResolved] = useState(false);
    const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hospitalName, setHospitalName] = useState<string>('');

    // ── Track auth state ──
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setUid(user?.uid ?? null);
            setAuthResolved(true);
        });
        return unsub;
    }, []);

    // ── Admin profile subscription (resolve hospitalPlaceId) ──
    useEffect(() => {
        const adminRef = ref(database, `admin/${uid}`);
        if (!authResolved) return;
        if (!uid) {
            setHospitalId(null);
            setHospitalName('');
            setLoading(false);
            return;
        }

        setLoading(true);

        const unsubscribe = onValue(
            adminRef,
            (snapshot) => {
                const data = snapshot.val() || {};
                setHospitalName(data.hospitalName || '');
                setHospitalId(data.hospitalPlaceId || uid); // fallback for legacy accounts
            },
            (err) => {
                console.error('[FleetData] Admin fetch error:', err);
                setError(err.message);
                setHospitalId(uid);
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [uid, authResolved]);

    // ── Hospital subscription (ambulances, drivers, pendingTransfers) ──
    useEffect(() => {
        if (!authResolved) return;
        if (!hospitalId) return;

        setLoading(true);
        const hospitalRef = ref(database, `hospitals/${hospitalId}`);

        const unsubscribe = onValue(
            hospitalRef,
            (snapshot) => {
                const data = snapshot.val() || {};

                const ambObj = data.ambulances || {};
                setAmbulances(
                    Object.entries(ambObj).map(([id, val]: [string, any]) => ({
                        id,
                        ...val,
                    })),
                );

                const drvObj = data.drivers || {};
                setDrivers(
                    Object.entries(drvObj).map(([id, val]: [string, any]) => ({
                        ...normalizeDriver(id, val),
                    })),
                );

                const pndObj = data.pendingTransfers || {};
                setPendingTransfers(
                    Object.entries(pndObj).map(([id, val]: [string, any]) => ({
                        id,
                        ...val,
                    })),
                );

                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('[FleetData] Hospital fetch error:', err);
                setError(err.message);
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, [hospitalId, authResolved]);

    // ── Helpers ──

    const addAmbulance = useCallback(async (unit: AmbulanceUnit) => {
        await apiPost('/fleet/ambulances', unit);
    }, []);

    const updateAmbulance = useCallback(async (id: string, changes: Partial<AmbulanceUnit>) => {
        if (!hospitalId) return;
        await update(ref(database, `hospitals/${hospitalId}/ambulances/${id}`), changes);
    }, [hospitalId]);

    const deleteAmbulance = useCallback(async (id: string) => {
        if (!hospitalId) return;
        await remove(ref(database, `hospitals/${hospitalId}/ambulances/${id}`));
    }, [hospitalId]);

    const addDriver = useCallback(async (driver: Driver) => {
        if (!hospitalId) return;
        await set(ref(database, `hospitals/${hospitalId}/drivers/${driver.id}`), driver);
    }, [hospitalId]);

    const updateDriver = useCallback(async (id: string, changes: Partial<Driver>) => {
        if (!hospitalId) return;
        await update(ref(database, `hospitals/${hospitalId}/drivers/${id}`), changes);
    }, [hospitalId]);

    const deleteDriver = useCallback(async (id: string) => {
        if (!hospitalId) return;
        await remove(ref(database, `hospitals/${hospitalId}/drivers/${id}`));
    }, [hospitalId]);

    const assignAmbulanceToTransfer = useCallback(async (ambId: string, transfer: PendingTransfer) => {
        if (!hospitalId) return;
        await update(ref(database, `hospitals/${hospitalId}/ambulances/${ambId}`), {
            status: 'in_service',
            currentTransfer: transfer.patient
        });
    }, [hospitalId]);

    const scheduleMaintenance = useCallback(async (ambId: string, date: string, notes: string) => {
        if (!hospitalId) return;
        await update(ref(database, `hospitals/${hospitalId}/ambulances/${ambId}`), {
            status: 'maintenance',
            nextServiceDue: date,
            maintenanceNotes: notes
        });
    }, [hospitalId]);

    const completeMaintenance = useCallback(async (ambId: string) => {
        if (!hospitalId) return;
        await update(ref(database, `hospitals/${hospitalId}/ambulances/${ambId}`), {
            status: 'available',
            lastService: new Date().toISOString()
        });
    }, [hospitalId]);

    const addPendingTransfer = useCallback(async (transfer: Omit<PendingTransfer, 'id'>) => {
        if (!hospitalId) return;
        const newRef = push(ref(database, `hospitals/${hospitalId}/pendingTransfers`));
        await set(newRef, transfer);
    }, [hospitalId]);

    const removePendingTransfer = useCallback(async (id: string) => {
        if (!hospitalId) return;
        await remove(ref(database, `hospitals/${hospitalId}/pendingTransfers/${id}`));
    }, [hospitalId]);

    return {
        ambulances,
        drivers,
        pendingTransfers,
        loading,
        error,
        hospitalName,
        addAmbulance,
        updateAmbulance,
        deleteAmbulance,
        addDriver,
        updateDriver,
        deleteDriver,
        assignAmbulanceToTransfer,
        scheduleMaintenance,
        completeMaintenance,
        addPendingTransfer,
        removePendingTransfer,
    };
}
