/**
 * useFleetData — Firebase Realtime Database hook
 *
 * Manages:
 *   /hospitals/{uid}/ambulances/{ambId}
 *   /hospitals/{uid}/drivers/{drvId}
 *   /hospitals/{uid}/pendingTransfers/{tfrId}
 *
 * Seeds the database with default data on first load if empty.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    ref,
    onValue,
    set,
    update,
    remove,
    get,
    push,
} from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { database, auth } from '../firebase';

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

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_AMBULANCES: AmbulanceUnit[] = [
    {
        id: 'AMB-001', status: 'available',
        driver: 'John Smith', driverGender: 'Male',
        attendant: 'Tom Wilson', attendantGender: 'Male',
        location: 'City General Hospital', lastService: '2025-11-15', nextServiceDue: '2026-02-15',
        equipment: ['Oxygen', 'Defibrillator', 'IV Fluids'],
        hasDoctor: false, hasVentilator: false, mileage: 42300, year: 2020,
    },
    {
        id: 'AMB-002', status: 'in_service',
        driver: 'Sarah Lee', driverGender: 'Female',
        attendant: 'Maria Garcia', attendantGender: 'Female',
        location: 'En route to Central Medical', currentTransfer: 'TR-2401', etaMinutes: 12,
        equipment: ['Oxygen', 'Ventilator', 'Cardiac Monitor'],
        hasDoctor: true, hasVentilator: true, mileage: 38100, year: 2021,
    },
    {
        id: 'AMB-003', status: 'available',
        driver: 'Mike Chen', driverGender: 'Male',
        attendant: 'Lisa Brown', attendantGender: 'Female',
        location: 'Divisional Hospital North', lastService: '2025-11-18', nextServiceDue: '2026-02-18',
        equipment: ['Oxygen', 'Defibrillator', 'IV Fluids', 'Stretcher'],
        hasDoctor: false, hasVentilator: false, mileage: 55700, year: 2019,
    },
    {
        id: 'AMB-004', status: 'maintenance',
        driver: 'David Kumar', driverGender: 'Male',
        attendant: 'Not Assigned', attendantGender: 'N/A',
        location: 'Service Center', lastService: '2025-11-20', nextServiceDue: '2026-02-20',
        maintenanceNotes: 'Scheduled brake inspection & oil change',
        equipment: [],
        hasDoctor: false, hasVentilator: false, mileage: 61200, year: 2018,
    },
    {
        id: 'AMB-005', status: 'available',
        driver: 'Emily Davis', driverGender: 'Female',
        attendant: 'Jessica Wong', attendantGender: 'Female',
        location: 'City General Hospital', lastService: '2025-11-17', nextServiceDue: '2026-02-17',
        equipment: ['Oxygen', 'Cardiac Monitor', 'IV Fluids'],
        hasDoctor: false, hasVentilator: false, mileage: 29800, year: 2022,
    },
    {
        id: 'AMB-006', status: 'in_service',
        driver: 'Robert Taylor', driverGender: 'Male',
        attendant: 'Mark Anderson', attendantGender: 'Male',
        location: 'En route to Regional Base', currentTransfer: 'TR-2402', etaMinutes: 18,
        equipment: ['Oxygen', 'Defibrillator', 'IV Fluids'],
        hasDoctor: false, hasVentilator: false, mileage: 47500, year: 2020,
    },
    {
        id: 'AMB-007', status: 'available',
        driver: 'Jennifer White', driverGender: 'Female',
        attendant: 'Anna Martinez', attendantGender: 'Female',
        location: 'Central Medical Center', lastService: '2025-11-16', nextServiceDue: '2026-02-16',
        equipment: ['Oxygen', 'Ventilator', 'Cardiac Monitor', 'Defibrillator'],
        hasDoctor: true, hasVentilator: true, mileage: 33200, year: 2021,
    },
    {
        id: 'AMB-008', status: 'available',
        driver: 'Chris Johnson', driverGender: 'Male',
        attendant: 'Paul Brown', attendantGender: 'Male',
        location: 'City General Hospital', lastService: '2025-11-19', nextServiceDue: '2026-02-19',
        equipment: ['Oxygen', 'IV Fluids', 'Stretcher'],
        hasDoctor: false, hasVentilator: false, mileage: 51000, year: 2019,
    },
];

const SEED_DRIVERS: Driver[] = [
    {
        id: 'DRV-001', name: 'John Smith', gender: 'Male',
        phone: '+91 98765 43210', email: 'john.smith@medigo.com',
        licenseNumber: 'TN-2019-0045231', licenseExpiry: '2027-06-30',
        joinDate: '2021-03-15', status: 'active', assignedAmbulance: 'AMB-001',
        rating: 4.7, totalTrips: 312, totalKm: 18540, avgResponseTime: '7 mins',
        incidentReports: 0, baseSalary: 28000, overtimeHours: 14, overtimeRate: 150,
        tripsBonus: 50, attendanceDays: 24, leaveDays: 2, fuelEfficiencyScore: 82,
    },
    {
        id: 'DRV-002', name: 'Sarah Lee', gender: 'Female',
        phone: '+91 87654 32109', email: 'sarah.lee@medigo.com',
        licenseNumber: 'TN-2020-0067452', licenseExpiry: '2026-03-15',
        joinDate: '2022-07-01', status: 'active', assignedAmbulance: 'AMB-002',
        rating: 4.9, totalTrips: 287, totalKm: 16230, avgResponseTime: '6 mins',
        incidentReports: 0, baseSalary: 30000, overtimeHours: 20, overtimeRate: 160,
        tripsBonus: 50, attendanceDays: 26, leaveDays: 0, fuelEfficiencyScore: 91,
    },
    {
        id: 'DRV-003', name: 'Mike Chen', gender: 'Male',
        phone: '+91 76543 21098', email: 'mike.chen@medigo.com',
        licenseNumber: 'TN-2018-0034521', licenseExpiry: '2025-11-30',
        joinDate: '2020-01-10', status: 'active', assignedAmbulance: 'AMB-003',
        rating: 4.2, totalTrips: 401, totalKm: 22100, avgResponseTime: '9 mins',
        incidentReports: 1, baseSalary: 27000, overtimeHours: 8, overtimeRate: 140,
        tripsBonus: 40, attendanceDays: 22, leaveDays: 4, fuelEfficiencyScore: 74,
    },
    {
        id: 'DRV-004', name: 'David Kumar', gender: 'Male',
        phone: '+91 65432 10987', email: 'david.kumar@medigo.com',
        licenseNumber: 'TN-2021-0089654', licenseExpiry: '2028-09-20',
        joinDate: '2023-02-20', status: 'off_duty', assignedAmbulance: 'AMB-004',
        rating: 3.8, totalTrips: 145, totalKm: 8970, avgResponseTime: '11 mins',
        incidentReports: 2, baseSalary: 25000, overtimeHours: 0, overtimeRate: 130,
        tripsBonus: 40, attendanceDays: 18, leaveDays: 8, fuelEfficiencyScore: 65,
    },
    {
        id: 'DRV-005', name: 'Emily Davis', gender: 'Female',
        phone: '+91 54321 09876', email: 'emily.davis@medigo.com',
        licenseNumber: 'TN-2020-0054123', licenseExpiry: '2026-12-01',
        joinDate: '2021-09-05', status: 'active', assignedAmbulance: 'AMB-005',
        rating: 4.5, totalTrips: 268, totalKm: 15400, avgResponseTime: '8 mins',
        incidentReports: 0, baseSalary: 29000, overtimeHours: 12, overtimeRate: 155,
        tripsBonus: 50, attendanceDays: 25, leaveDays: 1, fuelEfficiencyScore: 88,
    },
    {
        id: 'DRV-006', name: 'Robert Taylor', gender: 'Male',
        phone: '+91 43210 98765', email: 'robert.taylor@medigo.com',
        licenseNumber: 'TN-2022-0012345', licenseExpiry: '2029-04-10',
        joinDate: '2023-06-01', status: 'on_leave', assignedAmbulance: 'AMB-006',
        rating: 4.0, totalTrips: 98, totalKm: 5600, avgResponseTime: '10 mins',
        incidentReports: 1, baseSalary: 24000, overtimeHours: 0, overtimeRate: 120,
        tripsBonus: 40, attendanceDays: 14, leaveDays: 12, fuelEfficiencyScore: 70,
    },
];

const SEED_TRANSFERS: PendingTransfer[] = [
    { id: 'REQ-1024', patient: 'Robert Taylor', from: 'Divisional Hospital East', to: 'City General Hospital', priority: 'urgent' },
    { id: 'REQ-1025', patient: 'Jennifer White', from: 'Rural Health Center', to: 'Central Medical Center', priority: 'standard' },
    { id: 'REQ-1026', patient: 'Arjun Perera', from: 'Metro Hospital', to: 'Specialist Care Hospital', priority: 'critical' },
];

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
    // authResolved stays false until onAuthStateChanged fires at least once.
    // This prevents loading from becoming false before auth has responded,
    // which caused the blank-page bug (uid starts null → effect set loading=false too early).
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
            setAuthResolved(true); // auth has responded — now the data effect can run
        });
        return unsub;
    }, []);

    // ── Seed once then subscribe. Cleanup always runs — no orphaned listeners. ──
    useEffect(() => {
        // Do nothing until Firebase auth has confirmed the user's state.
        // Without this guard the effect fires immediately with uid=null and
        // sets loading=false before auth resolves → blank page.
        if (!authResolved) return;

        if (uid === null) {
            // Auth resolved but no user is signed in
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const basePath = `hospitals/${uid}`;
        const ambRef = ref(database, `${basePath}/ambulances`);
        const drvRef = ref(database, `${basePath}/drivers`);
        const tfrRef = ref(database, `${basePath}/pendingTransfers`);

        // Unsubscribe handles — populated after seed completes
        let unsubAmb: (() => void) | null = null;
        let unsubDrv: (() => void) | null = null;
        let unsubTfr: (() => void) | null = null;
        // Safety flag: if the effect was torn down before the async seed
        // finished we must not attach any listeners
        let cancelled = false;

        const seedAndSubscribe = async () => {
            try {
                // One-time read to decide what needs seeding
                const [ambSnap, drvSnap, tfrSnap] = await Promise.all([
                    get(ambRef),
                    get(drvRef),
                    get(tfrRef),
                ]);

                if (cancelled) return; // component unmounted during the await

                const writes: Record<string, unknown> = {};

                if (!ambSnap.exists()) {
                    SEED_AMBULANCES.forEach(a => {
                        writes[`${basePath}/ambulances/${a.id}`] = a;
                    });
                }
                if (!drvSnap.exists()) {
                    SEED_DRIVERS.forEach(d => {
                        writes[`${basePath}/drivers/${d.id}`] = d;
                    });
                }
                if (!tfrSnap.exists()) {
                    SEED_TRANSFERS.forEach(t => {
                        writes[`${basePath}/pendingTransfers/${t.id}`] = t;
                    });
                }

                if (Object.keys(writes).length > 0) {
                    await update(ref(database), writes);
                    if (cancelled) return;
                }

                // Firebase stores JS arrays as plain objects {0:'a',1:'b',...}.
                // This converts them back to real arrays so .map() doesn't crash.
                const toArray = (val: unknown): string[] => {
                    if (!val) return [];
                    if (Array.isArray(val)) return val;
                    return Object.values(val as Record<string, string>);
                };

                const normalizeAmb = (raw: Record<string, unknown>): AmbulanceUnit => ({
                    ...(raw as unknown as AmbulanceUnit),
                    equipment: toArray(raw.equipment),
                });

                // ── Real-time listeners (attached once per uid) ──
                unsubAmb = onValue(
                    ambRef,
                    (snap) => {
                        setAmbulances(
                            snap.exists()
                                ? Object.values(snap.val() as Record<string, Record<string, unknown>>).map(normalizeAmb)
                                : [],
                        );
                        setLoading(false);
                    },
                    (err) => {
                        setError(err.message);
                        setLoading(false);
                    },
                );

                unsubDrv = onValue(drvRef, (snap) => {
                    setDrivers(
                        snap.exists()
                            ? Object.values(snap.val() as Record<string, Driver>)
                            : [],
                    );
                });

                unsubTfr = onValue(tfrRef, (snap) => {
                    setPendingTransfers(
                        snap.exists()
                            ? Object.values(snap.val() as Record<string, PendingTransfer>)
                            : [],
                    );
                });
            } catch (err) {
                if (!cancelled) {
                    console.error('Fleet seed error:', err);
                    setError('Failed to initialise fleet data.');
                    setLoading(false);
                }
            }
        };

        seedAndSubscribe();

        // ── Cleanup — always called by React on unmount or uid change ──
        return () => {
            cancelled = true;
            unsubAmb?.();
            unsubDrv?.();
            unsubTfr?.();
        };
    }, [uid, authResolved]);

    // ── Ambulance CRUD ──

    const addAmbulance = useCallback(async (unit: AmbulanceUnit) => {
        if (!uid) throw new Error('Not authenticated');
        await set(ref(database, `hospitals/${uid}/ambulances/${unit.id}`), unit);
    }, [uid]);

    const updateAmbulance = useCallback(async (id: string, changes: Partial<AmbulanceUnit>) => {
        if (!uid) throw new Error('Not authenticated');
        await update(ref(database, `hospitals/${uid}/ambulances/${id}`), changes);
    }, [uid]);

    const deleteAmbulance = useCallback(async (id: string) => {
        if (!uid) throw new Error('Not authenticated');
        await remove(ref(database, `hospitals/${uid}/ambulances/${id}`));
    }, [uid]);

    // ── Driver CRUD ──

    const addDriver = useCallback(async (driver: Driver) => {
        if (!uid) throw new Error('Not authenticated');
        await set(ref(database, `hospitals/${uid}/drivers/${driver.id}`), driver);
    }, [uid]);

    const updateDriver = useCallback(async (id: string, changes: Partial<Driver>) => {
        if (!uid) throw new Error('Not authenticated');
        await update(ref(database, `hospitals/${uid}/drivers/${id}`), changes);
    }, [uid]);

    const deleteDriver = useCallback(async (id: string) => {
        if (!uid) throw new Error('Not authenticated');
        await remove(ref(database, `hospitals/${uid}/drivers/${id}`));
    }, [uid]);

    // ── Assignment helpers ──

    const assignAmbulanceToTransfer = useCallback(async (
        ambId: string,
        transfer: PendingTransfer,
    ) => {
        if (!uid) throw new Error('Not authenticated');
        await update(ref(database, `hospitals/${uid}/ambulances/${ambId}`), {
            status: 'in_service',
            currentTransfer: transfer.id,
            etaMinutes: 15,
            location: `En route to ${transfer.to}`,
        });
    }, [uid]);

    const scheduleMaintenance = useCallback(async (
        ambId: string,
        date: string,
        notes: string,
    ) => {
        if (!uid) throw new Error('Not authenticated');
        const changes: Partial<AmbulanceUnit> & Record<string, unknown> = {
            status: 'maintenance',
            location: 'Service Center',
            currentTransfer: null,
            etaMinutes: null,
        };
        if (date) changes.nextServiceDue = date;
        if (notes) changes.maintenanceNotes = notes;
        await update(ref(database, `hospitals/${uid}/ambulances/${ambId}`), changes);
    }, [uid]);

    const completeMaintenance = useCallback(async (ambId: string) => {
        if (!uid) throw new Error('Not authenticated');
        await update(ref(database, `hospitals/${uid}/ambulances/${ambId}`), {
            status: 'available',
            location: 'City General Hospital',
            lastService: new Date().toISOString().slice(0, 10),
            maintenanceNotes: null,
            currentTransfer: null,
            etaMinutes: null,
        });
    }, [uid]);

    // ── Pending transfer operations ──

    const addPendingTransfer = useCallback(async (transfer: Omit<PendingTransfer, 'id'>) => {
        if (!uid) throw new Error('Not authenticated');
        const newRef = push(ref(database, `hospitals/${uid}/pendingTransfers`));
        await set(newRef, { ...transfer, id: newRef.key });
    }, [uid]);

    const removePendingTransfer = useCallback(async (id: string) => {
        if (!uid) throw new Error('Not authenticated');
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
