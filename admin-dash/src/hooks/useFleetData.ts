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

// ─── Hook return type ─────────────────────────────────────────────────────────

export interface UseFleetDataReturn {
    ambulances: AmbulanceUnit[];
    drivers: Driver[];
    pendingTransfers: PendingTransfer[];
    loading: boolean;
    error: string | null;

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
    const [authResolved, setAuthResolved] = useState(false);
    const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ── Track auth state ──
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            setUid(user?.uid ?? null);
            setAuthResolved(true);
        });
        return unsub;
    }, []);

    // ── Firebase subscription ──
    useEffect(() => {
        if (!authResolved || !uid) {
            setLoading(false);
            return;
        }

        const hospitalRef = ref(database, `hospitals/${uid}`);

        const unsub = onValue(hospitalRef, (snapshot) => {
            const data = snapshot.val() || {};

            // Parse Ambulances
            const ambObj = data.ambulances || {};
            setAmbulances(Object.entries(ambObj).map(([id, val]: [string, any]) => ({ id, ...val })));

            // Parse Drivers
            const drvObj = data.drivers || {};
            setDrivers(Object.entries(drvObj).map(([id, val]: [string, any]) => ({ id, ...val })));

            // Parse Pending Transfers
            const pndObj = data.pendingTransfers || {};
            setPendingTransfers(Object.entries(pndObj).map(([id, val]: [string, any]) => ({ id, ...val })));

            setLoading(false);
            setError(null);
        }, (err) => {
            console.error('[FleetData] Firebase error:', err);
            setError(err.message);
            setLoading(false);
        });

        return () => off(hospitalRef, 'value', unsub);
    }, [uid, authResolved]);

    // ── Helpers ──

    const addAmbulance = useCallback(async (unit: AmbulanceUnit) => {
        await apiPost('/fleet/ambulances', unit);
    }, []);

    const updateAmbulance = useCallback(async (id: string, changes: Partial<AmbulanceUnit>) => {
        if (!uid) return;
        await update(ref(database, `hospitals/${uid}/ambulances/${id}`), changes);
    }, [uid]);

    const deleteAmbulance = useCallback(async (id: string) => {
        if (!uid) return;
        await remove(ref(database, `hospitals/${uid}/ambulances/${id}`));
    }, [uid]);

    const addDriver = useCallback(async (driver: Driver) => {
        if (!uid) return;
        await set(ref(database, `hospitals/${uid}/drivers/${driver.id}`), driver);
    }, [uid]);

    const updateDriver = useCallback(async (id: string, changes: Partial<Driver>) => {
        if (!uid) return;
        await update(ref(database, `hospitals/${uid}/drivers/${id}`), changes);
    }, [uid]);

    const deleteDriver = useCallback(async (id: string) => {
        if (!uid) return;
        await remove(ref(database, `hospitals/${uid}/drivers/${id}`));
    }, [uid]);

    const assignAmbulanceToTransfer = useCallback(async (ambId: string, transfer: PendingTransfer) => {
        if (!uid) return;
        await update(ref(database, `hospitals/${uid}/ambulances/${ambId}`), {
            status: 'in_service',
            currentTransfer: transfer.patient
        });
    }, [uid]);

    const scheduleMaintenance = useCallback(async (ambId: string, date: string, notes: string) => {
        if (!uid) return;
        await update(ref(database, `hospitals/${uid}/ambulances/${ambId}`), {
            status: 'maintenance',
            nextServiceDue: date,
            maintenanceNotes: notes
        });
    }, [uid]);

    const completeMaintenance = useCallback(async (ambId: string) => {
        if (!uid) return;
        await update(ref(database, `hospitals/${uid}/ambulances/${ambId}`), {
            status: 'available',
            lastService: new Date().toISOString()
        });
    }, [uid]);

    const addPendingTransfer = useCallback(async (transfer: Omit<PendingTransfer, 'id'>) => {
        if (!uid) return;
        const newRef = push(ref(database, `hospitals/${uid}/pendingTransfers`));
        await set(newRef, transfer);
    }, [uid]);

    const removePendingTransfer = useCallback(async (id: string) => {
        if (!uid) return;
        await remove(ref(database, `hospitals/${uid}/pendingTransfers/${id}`));
    }, [uid]);

    return {
        ambulances,
        drivers,
        pendingTransfers,
        loading,
        error,
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
