import { Module } from '@nestjs/common';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule],
    controllers: [TransfersController],
    providers: [TransfersService],
    exports: [TransfersService],
})
export class TransfersModule { }
