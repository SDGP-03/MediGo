import 'dotenv/config';
import * as admin from 'firebase-admin';

async function diagnose() {
    const databaseURL = process.env.FIREBASE_DATABASE_URL;
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    const initOptions: admin.AppOptions = { databaseURL };
    if (serviceAccountPath) {
        const serviceAccount = require(serviceAccountPath);
        initOptions.credential = admin.credential.cert(serviceAccount);
    } else {
        initOptions.credential = admin.credential.applicationDefault();
    }

    if (!admin.apps.length) admin.initializeApp(initOptions);
    const db = admin.database();

    const snapshot = await db.ref('transfer_requests').get();
    const data = snapshot.val();
    
    console.log('--- Active Transfers Detail ---');
    Object.entries(data).forEach(([key, value]: [string, any]) => {
        if (value.status === 'in_progress') {
            console.log(`Transfer ID: ${key}`);
            console.log(`  Status: ${value.status}`);
            console.log(`  Driver ID: ${value.driverId}`);
            console.log(`  Destination: ${JSON.stringify(value.destination)}`);
            console.log(`  Current ETA in DB: ${value.eta}`);
            console.log(`  Current Distance in DB: ${value.distance}`);
        }
    });
    
    process.exit(0);
}

diagnose();
