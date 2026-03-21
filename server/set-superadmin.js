require('dotenv').config();
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!databaseURL) {
    console.error('FIREBASE_DATABASE_URL is not set in .env');
    process.exit(1);
}

const initOptions = { databaseURL };

if (serviceAccountPath) {
    const path = require('path');
    const fullPath = path.resolve(__dirname, serviceAccountPath);
    const serviceAccount = require(fullPath);
    initOptions.credential = admin.credential.cert(serviceAccount);
} else {
    initOptions.credential = admin.credential.applicationDefault();
}

admin.initializeApp(initOptions);

const uid = 'ORMC6dprnpToHNFNmNnxkZa1Iuf2';

async function setSuperAdmin() {
    try {
        await admin.auth().setCustomUserClaims(uid, { role: 'superadmin' });
        console.log('Successfully added superadmin claim to', uid);
        
        const userRecord = await admin.auth().getUser(uid);
        
        const superAdminRef = admin.database().ref(`admin/${uid}`);
        await superAdminRef.set({
            uid: uid,
            name: userRecord.displayName || 'Developer',
            email: userRecord.email || '',
            role: 'superadmin',
            hospitalName: 'HQ',
            hospitalPlaceId: 'SUPERADMIN',
            createdAt: new Date().toISOString()
        });
        console.log('Successfully created superadmin database profile.');

    } catch (error) {
        console.error('Error setting superadmin:', error);
    } finally {
        process.exit(0);
    }
}

setSuperAdmin();
