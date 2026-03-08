/**
 * useFleetData — Backend API hook (replaces direct Firebase access)
 *
 * Manages:
 *   /hospitals/{uid}/ambulances/{ambId}
 *   /hospitals/{uid}/drivers/{drvId}
 *   /hospitals/{uid}/pendingTransfers/{tfrId}
 *
 * Uses SSE for real-time updates and REST for mutations.
 */

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { createSSE, apiPost, apiPut, apiDelete } from '../api/apiClient';

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

    // ── SSE subscription to backend ──
    useEffect(() => {
        if (!authResolved) return;

        if (uid === null) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const cleanup = createSSE(
            '/fleet/stream',
            (data) => {
                if (data.ambulances) setAmbulances(data.ambulances);
                if (data.drivers) setDrivers(data.drivers);
                if (data.pendingTransfers) setPendingTransfers(data.pendingTransfers);
                setLoading(false);
            },
            () => {
                setError('Connection lost. Reconnecting...');
            },
        );

        return cleanup;
    }, [uid, authResolved]);

    // ── Ambulance CRUD (via backend API) ──

    const addAmbulance = useCallback(async (unit: AmbulanceUnit) => {
        await apiPost('/fleet/ambulances', unit);
    }, []);

    const updateAmbulance = useCallback(async (id: string, changes: Partial<AmbulanceUnit>) => {
        await apiPut(`/fleet/ambulances/${id}`, changes);
    }, []);

    const deleteAmbulance = useCallback(async (id: string) => {
        await apiDelete(`/fleet/ambulances/${id}`);
    }, []);

    // ── Driver CRUD ──

    const addDriver = useCallback(async (driver: Driver) => {
        await apiPost('/fleet/drivers', driver);
    }, []);

    const updateDriver = useCallback(async (id: string, changes: Partial<Driver>) => {
        await apiPut(`/fleet/drivers/${id}`, changes);
    }, []);

    const deleteDriver = useCallback(async (id: string) => {
        await apiDelete(`/fleet/drivers/${id}`);
    }, []);

    // ── Assignment helpers ──

    const assignAmbulanceToTransfer = useCallback(async (
        ambId: string,
        transfer: PendingTransfer,
    ) => {
        await apiPost(`/fleet/ambulances/${ambId}/assign`, transfer);
    }, []);

    const scheduleMaintenance = useCallback(async (
        ambId: string,
        date: string,
        notes: string,
    ) => {
        await apiPost(`/fleet/ambulances/${ambId}/maintenance`, { date, notes });
    }, []);

    const completeMaintenance = useCallback(async (ambId: string) => {
        await apiPost(`/fleet/ambulances/${ambId}/complete-maintenance`, {});
    }, []);

    // ── Pending transfer operations ──

    const addPendingTransfer = useCallback(async (transfer: Omit<PendingTransfer, 'id'>) => {
        await apiPost('/fleet/pending-transfers', transfer);
    }, []);

    const removePendingTransfer = useCallback(async (id: string) => {
        await apiDelete(`/fleet/pending-transfers/${id}`);
    }, []);

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
