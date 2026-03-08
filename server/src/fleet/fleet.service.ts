import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { Observable } from 'rxjs';

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_AMBULANCES = [
    {
        id: 'AMB-001', status: 'available',
        driver: 'John Smith', driverGender: 'Male',
        attendant: 'Tom Wilson', attendantGender: 'Male',
        location: 'City General Hospital', lastService: '2025-11-15', nextServiceDue: '2026-02-15',
        equipment: ['Oxygen', 'Defibrillator', 'IV Fluids'],
        hasDoctor: false, hasVentilator: false, mileage: 42300, year: 2020,
        fuelConsumed: 1078, monthlyFuelData: { Jan: 150, Feb: 145, Mar: 155, Apr: 148, May: 160, Jun: 155, Jul: 165 },
    },
    {
        id: 'AMB-002', status: 'in_service',
        driver: 'Sarah Lee', driverGender: 'Female',
        attendant: 'Maria Garcia', attendantGender: 'Female',
        location: 'En route to Central Medical', currentTransfer: 'TR-2401', etaMinutes: 12,
        equipment: ['Oxygen', 'Ventilator', 'Cardiac Monitor'],
        hasDoctor: true, hasVentilator: true, mileage: 38100, year: 2021,
        fuelConsumed: 942, monthlyFuelData: { Jan: 132, Feb: 128, Mar: 135, Apr: 130, May: 138, Jun: 132, Jul: 147 },
    },
    {
        id: 'AMB-003', status: 'available',
        driver: 'Mike Chen', driverGender: 'Male',
        attendant: 'Lisa Brown', attendantGender: 'Female',
        location: 'Divisional Hospital North', lastService: '2025-11-18', nextServiceDue: '2026-02-18',
        equipment: ['Oxygen', 'Defibrillator', 'IV Fluids', 'Stretcher'],
        hasDoctor: false, hasVentilator: false, mileage: 55700, year: 2019,
        fuelConsumed: 1540, monthlyFuelData: { Jan: 210, Feb: 205, Mar: 218, Apr: 212, May: 225, Jun: 220, Jul: 250 },
    },
    {
        id: 'AMB-004', status: 'maintenance',
        driver: 'David Kumar', driverGender: 'Male',
        attendant: 'Not Assigned', attendantGender: 'N/A',
        location: 'Service Center', lastService: '2025-11-20', nextServiceDue: '2026-02-20',
        maintenanceNotes: 'Scheduled brake inspection & oil change',
        equipment: [],
        hasDoctor: false, hasVentilator: false, mileage: 61200, year: 2018,
        fuelConsumed: 1673, monthlyFuelData: { Jan: 235, Feb: 228, Mar: 242, Apr: 235, May: 245, Jun: 240, Jul: 248 },
    },
    {
        id: 'AMB-005', status: 'available',
        driver: 'Emily Davis', driverGender: 'Female',
        attendant: 'Jessica Wong', attendantGender: 'Female',
        location: 'City General Hospital', lastService: '2025-11-17', nextServiceDue: '2026-02-17',
        equipment: ['Oxygen', 'Cardiac Monitor', 'IV Fluids'],
        hasDoctor: false, hasVentilator: false, mileage: 29800, year: 2022,
        fuelConsumed: 735, monthlyFuelData: { Jan: 102, Feb: 98, Mar: 105, Apr: 102, May: 110, Jun: 105, Jul: 113 },
    },
    {
        id: 'AMB-006', status: 'in_service',
        driver: 'Robert Taylor', driverGender: 'Male',
        attendant: 'Mark Anderson', attendantGender: 'Male',
        location: 'En route to Regional Base', currentTransfer: 'TR-2402', etaMinutes: 18,
        equipment: ['Oxygen', 'Defibrillator', 'IV Fluids'],
        hasDoctor: false, hasVentilator: false, mileage: 47500, year: 2020,
        fuelConsumed: 1165, monthlyFuelData: { Jan: 165, Feb: 160, Mar: 170, Apr: 165, May: 172, Jun: 168, Jul: 165 },
    },
    {
        id: 'AMB-007', status: 'available',
        driver: 'Jennifer White', driverGender: 'Female',
        attendant: 'Anna Martinez', attendantGender: 'Female',
        location: 'Central Medical Center', lastService: '2025-11-16', nextServiceDue: '2026-02-16',
        equipment: ['Oxygen', 'Ventilator', 'Cardiac Monitor', 'Defibrillator'],
        hasDoctor: true, hasVentilator: true, mileage: 33200, year: 2021,
        fuelConsumed: 820, monthlyFuelData: { Jan: 115, Feb: 110, Mar: 120, Apr: 115, May: 125, Jun: 120, Jul: 115 },
    },
    {
        id: 'AMB-008', status: 'available',
        driver: 'Chris Johnson', driverGender: 'Male',
        attendant: 'Paul Brown', attendantGender: 'Male',
        location: 'City General Hospital', lastService: '2025-11-19', nextServiceDue: '2026-02-19',
        equipment: ['Oxygen', 'IV Fluids', 'Stretcher'],
        hasDoctor: false, hasVentilator: false, mileage: 51000, year: 2019,
        fuelConsumed: 1420, monthlyFuelData: { Jan: 195, Feb: 190, Mar: 205, Apr: 200, May: 210, Jun: 205, Jul: 215 },
    },
];

const SEED_DRIVERS = [
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

const SEED_TRANSFERS = [
    { id: 'REQ-1024', patient: 'Robert Taylor', from: 'Divisional Hospital East', to: 'City General Hospital', priority: 'urgent' },
    { id: 'REQ-1025', patient: 'Jennifer White', from: 'Rural Health Center', to: 'Central Medical Center', priority: 'standard' },
    { id: 'REQ-1026', patient: 'Arjun Perera', from: 'Metro Hospital', to: 'Specialist Care Hospital', priority: 'critical' },
];

@Injectable()
export class FleetService {
    private readonly logger = new Logger(FleetService.name);

    constructor(private readonly firebase: FirebaseService) { }

    /** Stream fleet data (ambulances, drivers, pending transfers) via SSE */
    streamFleet(uid: string): Observable<MessageEvent> {
        return new Observable((subscriber) => {
            const basePath = `hospitals/${uid}`;
            const ambRef = this.firebase.ref(`${basePath}/ambulances`);
            const drvRef = this.firebase.ref(`${basePath}/drivers`);
            const tfrRef = this.firebase.ref(`${basePath}/pendingTransfers`);

            let ambulances: any[] = [];
            let drivers: any[] = [];
            let pendingTransfers: any[] = [];
            let initialised = false;

            const emit = () => {
                subscriber.next({
                    data: JSON.stringify({ ambulances, drivers, pendingTransfers }),
                } as MessageEvent);
            };

            // Emit immediately so frontend doesn't hang waiting for Firebase
            emit();

            const toArray = (val: unknown): string[] => {
                if (!val) return [];
                if (Array.isArray(val)) return val;
                return Object.values(val as Record<string, string>);
            };

            const normalizeAmb = (raw: Record<string, unknown>) => ({
                ...raw,
                equipment: toArray(raw['equipment']),
            });

            const cbAmb = ambRef.on('value', (snap) => {
                ambulances = snap.exists()
                    ? Object.values(snap.val()).map((v: any) => normalizeAmb(v))
                    : [];
                emit();
                if (!initialised) initialised = true;
            });

            const cbDrv = drvRef.on('value', (snap) => {
                drivers = snap.exists() ? Object.values(snap.val()) : [];
                emit();
            });

            const cbTfr = tfrRef.on('value', (snap) => {
                pendingTransfers = snap.exists() ? Object.values(snap.val()) : [];
                emit();
            });

            // Seed if empty
            this.seedIfEmpty(uid).catch((err) =>
                this.logger.error('Seed error:', err),
            );

            return () => {
                ambRef.off('value', cbAmb);
                drvRef.off('value', cbDrv);
                tfrRef.off('value', cbTfr);
                this.logger.log('Fleet SSE stream closed');
            };
        });
    }

    /** Seed default data on first load */
    private async seedIfEmpty(uid: string): Promise<void> {
        const basePath = `hospitals/${uid}`;
        const db = this.firebase.getDatabase();

        const [ambSnap, drvSnap, tfrSnap] = await Promise.all([
            db.ref(`${basePath}/ambulances`).get(),
            db.ref(`${basePath}/drivers`).get(),
            db.ref(`${basePath}/pendingTransfers`).get(),
        ]);

        const writes: Record<string, unknown> = {};

        if (!ambSnap.exists()) {
            SEED_AMBULANCES.forEach((a) => {
                writes[`${basePath}/ambulances/${a.id}`] = a;
            });
        }
        if (!drvSnap.exists()) {
            SEED_DRIVERS.forEach((d) => {
                writes[`${basePath}/drivers/${d.id}`] = d;
            });
        }
        if (!tfrSnap.exists()) {
            SEED_TRANSFERS.forEach((t) => {
                writes[`${basePath}/pendingTransfers/${t.id}`] = t;
            });
        }

        if (Object.keys(writes).length > 0) {
            await db.ref().update(writes);
            this.logger.log(`Seeded fleet data for hospital ${uid}`);
        }
    }

    // ── Ambulance CRUD ──

    async addAmbulance(uid: string, unit: any): Promise<void> {
        await this.firebase
            .ref(`hospitals/${uid}/ambulances/${unit.id}`)
            .set(unit);
    }

    async updateAmbulance(uid: string, id: string, changes: any): Promise<void> {
        await this.firebase
            .ref(`hospitals/${uid}/ambulances/${id}`)
            .update(changes);
    }

    async deleteAmbulance(uid: string, id: string): Promise<void> {
        await this.firebase
            .ref(`hospitals/${uid}/ambulances/${id}`)
            .remove();
    }

    // ── Driver CRUD ──

    async addDriver(uid: string, driver: any): Promise<void> {
        await this.firebase
            .ref(`hospitals/${uid}/drivers/${driver.id}`)
            .set(driver);
    }

    async updateDriver(uid: string, id: string, changes: any): Promise<void> {
        await this.firebase
            .ref(`hospitals/${uid}/drivers/${id}`)
            .update(changes);
    }

    async deleteDriver(uid: string, id: string): Promise<void> {
        await this.firebase
            .ref(`hospitals/${uid}/drivers/${id}`)
            .remove();
    }

    // ── Assignment helpers ──

    async assignAmbulanceToTransfer(
        uid: string,
        ambId: string,
        transfer: any,
    ): Promise<void> {
        await this.firebase
            .ref(`hospitals/${uid}/ambulances/${ambId}`)
            .update({
                status: 'in_service',
                currentTransfer: transfer.id,
                etaMinutes: 15,
                location: `En route to ${transfer.to}`,
            });
    }

    async scheduleMaintenance(
        uid: string,
        ambId: string,
        date: string,
        notes: string,
    ): Promise<void> {
        const changes: Record<string, unknown> = {
            status: 'maintenance',
            location: 'Service Center',
            currentTransfer: null,
            etaMinutes: null,
        };
        if (date) changes['nextServiceDue'] = date;
        if (notes) changes['maintenanceNotes'] = notes;
        await this.firebase
            .ref(`hospitals/${uid}/ambulances/${ambId}`)
            .update(changes);
    }

    async completeMaintenance(uid: string, ambId: string): Promise<void> {
        await this.firebase
            .ref(`hospitals/${uid}/ambulances/${ambId}`)
            .update({
                status: 'available',
                location: 'City General Hospital',
                lastService: new Date().toISOString().slice(0, 10),
                maintenanceNotes: null,
                currentTransfer: null,
                etaMinutes: null,
            });
    }

    // ── Pending transfer operations ──

    async addPendingTransfer(uid: string, transfer: any): Promise<{ id: string }> {
        const newRef = this.firebase
            .ref(`hospitals/${uid}/pendingTransfers`)
            .push();
        await newRef.set({ ...transfer, id: newRef.key });
        return { id: newRef.key! };
    }

    async removePendingTransfer(uid: string, id: string): Promise<void> {
        await this.firebase
            .ref(`hospitals/${uid}/pendingTransfers/${id}`)
            .remove();
    }
}
