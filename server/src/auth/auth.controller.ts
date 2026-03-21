import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('create-hospital-staff')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('superadmin')
    async createHospitalStaff(@Body() body: any) {
        return this.authService.createHospitalStaff(body);
    }
}
