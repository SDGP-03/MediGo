const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';
const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!databaseURL) {
    console.error('FIREBASE_DATABASE_URL is missing in .env');
    process.exit(1);
}

// Resolve the service account path relative to the server directory
const absoluteServiceAccountPath = path.isAbsolute(serviceAccountPath) 
    ? serviceAccountPath 
    : path.join(__dirname, '..', serviceAccountPath);

// eslint-disable-next-line @typescript-eslint/no-require-imports
const serviceAccount = require(absoluteServiceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
});

async function setupSuperAdmin(email: string, password: string, name: string) {
    try {
        console.log(`Creating user: ${email}...`);
        
        // 1. Create User in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });

        const uid = userRecord.uid;
        console.log(`User created with UID: ${uid}`);

        // 2. Set Custom Claims
        console.log('Setting custom claims...');
        await admin.auth().setCustomUserClaims(uid, { role: 'superadmin' });

        // 3. Save to Realtime Database
        console.log('Saving to Realtime Database...');
        await admin.database().ref(`admin/${uid}`).set({
            uid,
            name,
            email,
            role: 'superadmin',
            createdAt: new Date().toISOString(),
        });

        console.log(`Successfully created and promoted ${email} to superadmin!`);
        process.exit(0);
    } catch (error: any) {
        console.error('Error setting up superadmin:', error.message);
        process.exit(1);
    }
}

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'SuperAdmin';

if (!email || !password) {
    console.log('Usage: npx ts-node scripts/setup-initial-admin.ts <email> <password> [name]');
    process.exit(1);
}

setupSuperAdmin(email, password, name);
