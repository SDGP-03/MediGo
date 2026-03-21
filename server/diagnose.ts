require('dotenv/config');
const admin = require('firebase-admin');

async function diagnose() {
    const databaseURL = process.env.FIREBASE_DATABASE_URL as string;
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    const initOptions: any = { databaseURL };
    if (serviceAccountPath) {
        const serviceAccount = require(serviceAccountPath);
        initOptions.credential = admin.credential.cert(serviceAccount);
    } else {
        initOptions.credential = admin.credential.applicationDefault();
    }

    if (!admin.apps.length) admin.initializeApp(initOptions);
    const db = admin.database();

    const [transfersSnap, driversSnap] = await Promise.all([
        db.ref('transfer_requests').get(),
        db.ref('driver_locations').get()
    ]);

    const transfers = transfersSnap.val() || {};
    const drivers = driversSnap.val() || {};

    const report = {
        transfers: Object.entries(transfers).map(([id, val]: [string, any]) => ({
            id,
            status: val.status,
            driverId: val.driverId,
            hasDest: !!(val.destination?.lat && val.destination?.lng)
        })),
        drivers: Object.entries(drivers).map(([id, val]: [string, any]) => ({
            id,
            lat: val.lat,
            lng: val.lng,
            status: val.status
        }))
    };

    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
}

diagnose();
