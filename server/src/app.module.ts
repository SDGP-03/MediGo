import { Module } from '@nestjs/common';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { TransfersModule } from './transfers/transfers.module';
import { DriversModule } from './drivers/drivers.module';
import { FleetModule } from './fleet/fleet.module';
import { PatientsModule } from './patients/patients.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UsersModule } from './users/users.module';

@Module({
    imports: [
        FirebaseModule,
        AuthModule,
        TransfersModule,
        DriversModule,
        FleetModule,
        PatientsModule,
        AnalyticsModule,
        UsersModule,
    ],
})
export class AppModule { }
