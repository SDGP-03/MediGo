import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class AuthService {
    constructor(private readonly firebase: FirebaseService) {}

    async createHospitalStaff(data: any) {
        const { name, email, password, hospitalName, placeId, role, address, lat, lng } = data;
        
        if (!['hospitaladmin', 'fleetofficer'].includes(role)) {
            throw new HttpException('Invalid role', HttpStatus.BAD_REQUEST);
        }
        if (!placeId) {
            throw new HttpException('Missing hospital placeId', HttpStatus.BAD_REQUEST);
        }

        try {
            // 1. Create User in Firebase Auth
            const userRecord = await this.firebase.getAuth().createUser({
                email,
                password,
                displayName: `${name} - ${hospitalName}`,
            });

            // 2. Set Custom Claims
            await this.firebase.getAuth().setCustomUserClaims(userRecord.uid, {
                role,
                hospitalId: placeId,
            });

            // 3. Save to Realtime Database
            const db = this.firebase.getDatabase();
            
            // Shared hospital node basic info (update to prevent overriding if already exists)
            await db.ref(`hospitals/${placeId}/info`).update({
                 name: hospitalName,
                 placeId: placeId,
                 ...(address && { address }),
                 ...(lat && lng && { location: { lat, lng } })
            });

            // Depending on role, save them in the respective arrays/nodes
            if (role === 'hospitaladmin') {
                await db.ref(`hospitals/${placeId}/admins/${userRecord.uid}`).set({
                    uid: userRecord.uid,
                    name,
                    email,
                    role,
                    joinedAt: new Date().toISOString(),
                });
            } else if (role === 'fleetofficer') {
                await db.ref(`hospitals/${placeId}/fleet_officers/${userRecord.uid}`).set({
                    uid: userRecord.uid,
                    name,
                    email,
                    role,
                    joinedAt: new Date().toISOString(),
                });
            }

            // Keep the global admin node for existing frontend logic
            await db.ref(`admin/${userRecord.uid}`).set({
                uid: userRecord.uid,
                name,
                email,
                hospitalName,
                hospitalPlaceId: placeId,
                role,
                createdAt: new Date().toISOString(),
            });

            return { success: true, uid: userRecord.uid };
        } catch (error: any) {
            throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
    }
}
