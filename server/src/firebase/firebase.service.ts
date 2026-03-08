import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name);
    private db!: admin.database.Database;
    private authAdmin!: admin.auth.Auth;

    onModuleInit() {
        if (admin.apps.length === 0) {
            // Use the service account key if available, otherwise use default credentials
            const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
            const databaseURL = process.env.FIREBASE_DATABASE_URL;

            if (!databaseURL) {
                throw new Error(
                    'FIREBASE_DATABASE_URL environment variable is required. ' +
                    'Set it in server/.env or as an environment variable.',
                );
            }

            const initOptions: admin.AppOptions = { databaseURL };

            if (serviceAccountPath) {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const serviceAccount = require(serviceAccountPath);
                initOptions.credential = admin.credential.cert(serviceAccount);
                this.logger.log('Initialized with service account credentials');
            } else {
                // For local dev: use Application Default Credentials
                initOptions.credential = admin.credential.applicationDefault();
                this.logger.log('Initialized with application default credentials');
            }

            admin.initializeApp(initOptions);
        }

        this.db = admin.database();
        this.authAdmin = admin.auth();
        this.logger.log('Firebase Admin SDK initialized');
    }

    /** Get the Realtime Database instance */
    getDatabase(): admin.database.Database {
        return this.db;
    }

    /** Get the Auth Admin instance (for verifying tokens) */
    getAuth(): admin.auth.Auth {
        return this.authAdmin;
    }

    /** Convenience: get a database reference */
    ref(path: string): admin.database.Reference {
        return this.db.ref(path);
    }
}
