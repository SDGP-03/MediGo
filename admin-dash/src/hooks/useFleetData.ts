/**
 * useFleetData — Direct Firebase hook (reverted from NestJS)
 */

import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, database } from '../firebase';
import { ref, onValue, push, update, remove, set } from 'firebase/database';
import { apiPost, apiPatch, apiDelete } from '../api/apiClient';
import { decryptData } from '../utils/encryption';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AmbulanceStatus = 'available' | 'in_service' | 'maintenance';
//ambulance
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
    patientId?: string;
    destination?: string;
    etaMinutes?: number;
    equipment: string[];
    hasDoctor: boolean;
    hasVentilator: boolean;
    mileage?: number;
    year?: number;
    fuelConsumed?: number;
    monthlyFuelData?: { [month: string]: number };
}

export type DriverStatus = 'active' | 'inactive';
// driverProfiles
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

// for pending transfer
export interface PendingTransfer {
    id: string;
    patient: string; // This stores the decrypted patient name/ID
    from: string;
    to: string;
    priority: 'critical' | 'urgent' | 'standard';
}

export interface TripRecord {
    id: string;
    ambulanceId: string;
    distanceKm: number;
    fuelUsedLiters: number;
    date: string;
    dayOfWeek: number; // 0=Sun .. 6=Sat
    month: string;
}

/**
 * normalizeDriver - A mapping function that transforms raw data from Firebase 
 * into a structured 'Driver' object. It handles data sanitization, schema 
 * compatibility, and provides default values.
 * helps when driver is blocked
 */
function normalizeDriver(id: string, raw: any): Driver {
    // Helper to ensure numerical fields are valid numbers; defaults to 0 if invalid.
    const safeNumber = (v: any, fallback = 0) => {
        const n = typeof v === 'number' ? v : Number(v);
        return Number.isFinite(n) ? n : fallback;
    };

    // Maps various raw status values to the strict 'active' | 'inactive' type.
    const statusFromRaw = (v: any): DriverStatus => {
        if (v === 'active') return 'active';
        return 'inactive';
    };

    return {
        id,
        // Support both modern 'name' and legacy 'driverName' fields.
        name: (raw?.name ?? raw?.driverName ?? 'Unknown Driver').toString(),
        // Validates gender against allowed values; defaults to 'Other'.
        gender: (raw?.gender === 'Male' || raw?.gender === 'Female' || raw?.gender === 'Other')
            ? raw.gender
            : 'Other',
        phone: (raw?.phone ?? '').toString(),
        email: (raw?.email ?? '').toString(),
        licenseNumber: (raw?.licenseNumber ?? '').toString(),
        licenseExpiry: (raw?.licenseExpiry ?? '').toString(),
        joinDate: (raw?.joinDate ?? '').toString(),
        // Check both 'status' and 'blockStatus' for backward compatibility.
        status: statusFromRaw(raw?.status ?? raw?.blockStatus),
        assignedAmbulance: raw?.assignedAmbulance ?? null,
        // Apply numeric sanitization to metrics and performance data.
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
    tripHistory: TripRecord[];
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
    hospitalId: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFleetData(): UseFleetDataReturn {
    // Stores the current Firebase Auth user ID 
    const [uid, setUid] = useState<string | null>(null);

    // Stores the unique ID for the hospital (used as the database path key)
    const [hospitalId, setHospitalId] = useState<string | null>(null);

    // Tracks if the initial authentication check with Firebase is finished
    const [authResolved, setAuthResolved] = useState(false);

    // List of all ambulance units registered to this hospital
    const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>([]);

    // List of all drivers registered to this hospital
    const [drivers, setDrivers] = useState<Driver[]>([]);

    // List of currently active/pending transfer requests
    const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);

    // List of historical trip records for analytics
    const [tripHistory, setTripHistory] = useState<TripRecord[]>([]);

    // Controls the global loading state for the fleet data subscription
    const [loading, setLoading] = useState(true);

    // Stores any error messages encountered during Firebase operations
    const [error, setError] = useState<string | null>(null);

    // The human-readable name of the hospital 
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
                        patient: decryptData(val.patient),
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

        // Subscribe to trip history
        const tripRef = ref(database, `hospitals/${hospitalId}/tripHistory`);
        const unsubTrips = onValue(
            tripRef,
            (snapshot) => {
                const data = snapshot.val();
                if (!data) { setTripHistory([]); return; }
                setTripHistory(
                    Object.entries(data).map(([id, val]: [string, any]) => ({
                        id,
                        ambulanceId: val.ambulanceId || '',
                        distanceKm: val.distanceKm || 0,
                        fuelUsedLiters: val.fuelUsedLiters || 0,
                        date: val.date || '',
                        dayOfWeek: val.dayOfWeek ?? 0,
                        month: val.month || '',
                    })),
                );
            },
        );

        return () => {
            unsubscribe();
            unsubTrips();
        };
    }, [hospitalId, authResolved]);

    // ── Helpers ──

    const addAmbulance = useCallback(async (unit: AmbulanceUnit) => {
        if (!hospitalId) return;
        await set(ref(database, `hospitals/${hospitalId}/ambulances/${unit.id}`), unit);
    }, [hospitalId]);

    const updateAmbulance = useCallback(async (id: string, changes: Partial<AmbulanceUnit>) => {
        if (!hospitalId) return;
        await update(ref(database, `hospitals/${hospitalId}/ambulances/${id}`), changes);
    }, [hospitalId]);

    const deleteAmbulance = useCallback(async (id: string) => {
        if (!hospitalId) return;
        await remove(ref(database, `hospitals/${hospitalId}/ambulances/${id}`));
    }, [hospitalId]);

    const addDriver = useCallback(async (driver: Driver) => {
        await apiPost('/drivers', driver);
    }, []);

    const updateDriver = useCallback(async (id: string, changes: Partial<Driver>) => {
        await apiPatch(`/drivers/${id}`, changes);
    }, []);

    const deleteDriver = useCallback(async (id: string) => {
        await apiDelete(`/drivers/${id}`);
    }, []);

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
        tripHistory,
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
        hospitalId,
    };
}
