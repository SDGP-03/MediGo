import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
    controllers: [AuthController],
    providers: [AuthGuard, RolesGuard, AuthService],
    exports: [AuthGuard, RolesGuard, AuthService],
})
export class AuthModule { }
