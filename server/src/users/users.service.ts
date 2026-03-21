import { Injectable, InternalServerErrorException, Logger, ConflictException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as admin from 'firebase-admin';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(private readonly firebase: FirebaseService) {}

    async createUser(dto: CreateUserDto) {
        const { name, email, password, role, hospitalName, hospitalPlaceId } = dto;

        if (role !== 'superadmin' && !hospitalPlaceId) {
            throw new Error('Hospital Place ID is required for admins and fleet officers.');
        }

        try {
            // 1. Create the user in Firebase Auth
            const userRecord = await this.firebase.getAuth().createUser({
                email,
                password,
                displayName: `${name} - ${hospitalName || 'Super Admin'}`,
            });
            const uid = userRecord.uid;

            // 2. Set Custom User Claims for Role-Based Access Control
            const claims: any = { role };
            if (hospitalPlaceId) {
                claims.hospitalId = hospitalPlaceId;
            }
            await this.firebase.getAuth().setCustomUserClaims(uid, claims);

            // 3. Save profile data to Realtime Database based on role
            const db = admin.database();
            
            if (role === 'admin' || role === 'superadmin') {
                // Save admin profile
                const adminRef = db.ref(`admin/${uid}`);
                await adminRef.set({
                    uid,
                    name,
                    email,
                    hospitalName: hospitalName || 'MediGo HQ',
                    hospitalPlaceId: hospitalPlaceId || 'SUPERADMIN',
                    role,
                    createdAt: new Date().toISOString(),
                });
            }

            if (role === 'fleet_officer') {
                // Save fleet officer profile
                const fleetOfficerRef = db.ref(`hospitals/${hospitalPlaceId}/fleet_officers/${uid}`);
                await fleetOfficerRef.set({
                    uid,
                    name,
                    email,
                    role,
                    joinedAt: new Date().toISOString(),
                });
            }

            if (role === 'driver') {
                // Save driver profile to both root and hospital nodes for compatibility
                const driverMap = {
                    id: uid,
                    uid,
                    name,
                    email,
                    role,
                    hospitalPlaceId,
                    hospitalName: hospitalName || '',
                    status: 'available',
                    createdAt: new Date().toISOString(),
                };

                await Promise.all([
                    db.ref(`drivers/${uid}`).set(driverMap),
                    db.ref(`hospitals/${hospitalPlaceId}/drivers/${uid}`).set(driverMap)
                ]);
            }

            if (role === 'admin' && hospitalPlaceId) {
                // Create/update the shared hospital node (keyed by placeId)
                // This ensures there is a primary info node if it doesn't exist
                const hospitalInfoRef = db.ref(`hospitals/${hospitalPlaceId}/info`);
                
                // We don't overwrite address/location here because we lack it from the simple dto.
                // The frontend should ideally send full location if creating it for the first time.
                // Let's at least ensure the node exists with name and placeId.
                const snap = await hospitalInfoRef.once('value');
                if (!snap.exists()) {
                    await hospitalInfoRef.set({
                        name: hospitalName,
                        placeId: hospitalPlaceId,
                    });
                }

                // Register this admin as a member of the hospital
                const hospitalAdminRef = db.ref(`hospitals/${hospitalPlaceId}/admins/${uid}`);
                await hospitalAdminRef.set({
                    uid,
                    name,
                    email,
                    role: 'admin',
                    joinedAt: new Date().toISOString(),
                });
            }

            return { uid, email, role, success: true };
        } catch (error: any) {
            this.logger.error(`Error creating user: ${error.message}`);
            if (error.code === 'auth/email-already-exists') {
                throw new ConflictException('Email address is already in use by another account.');
            }
            if (error.code === 'auth/invalid-password') {
                throw new ConflictException('Password is too weak. Must be at least 6 characters.');
            }
            throw new InternalServerErrorException(error.message);
        }
    }
}
