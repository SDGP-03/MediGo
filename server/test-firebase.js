const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://medigo-41f2a-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();

async function test() {
    console.log("Starting fetch...");
    try {
        const snap = await db.ref('transfer_requests').once('value');
        console.log("Fetched!");
        console.log(snap.exists());
    } catch (e) {
        console.error("Error:", e);
    } finally {
        process.exit(0);
    }
}

test();
