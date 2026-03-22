import { Module } from '@nestjs/common';
import { HospitalsController } from './hospitals.controller';
import { HospitalsService } from './hospitals.service';
import { FirebaseModule } from '../firebase/firebase.module'; // Adjust path if needed

@Module({
    imports: [FirebaseModule],
    controllers: [HospitalsController],
    providers: [HospitalsService],
    exports: [HospitalsService],
})
export class HospitalsModule { }
