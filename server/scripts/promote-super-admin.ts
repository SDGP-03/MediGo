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

const serviceAccount = require(path.resolve(__dirname, '..', serviceAccountPath));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: databaseURL
});

async function promoteToSuperAdmin(email: string) {
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { role: 'superadmin' });
        
        // Also update the database to reflect the role for frontend logic
        await admin.database().ref(`admin/${user.uid}`).update({
            role: 'superadmin'
        });

        console.log(`Successfully promoted ${email} to superadmin!`);
        process.exit(0);
    } catch (error) {
        console.error('Error promoting user:', error);
        process.exit(1);
    }
}

const email = process.argv[2];
if (!email) {
    console.log('Usage: npx ts-node scripts/promote-super-admin.ts <email>');
    process.exit(1);
}

promoteToSuperAdmin(email);
