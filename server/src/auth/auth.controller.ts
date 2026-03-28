import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

/**
 * Controller for authentication-related endpoints.
 * Handles tasks such as user creation and role management.
 */
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * Creates a new hospital staff member.
     * This endpoint is restricted by two layers of security:
     * 1. AuthGuard: Ensures the request is authenticated (usually via JWT).
     * 2. RolesGuard: Checks the metadata set by `@Roles`.
     * 3. Roles('superadmin'): Only allows users with the 'superadmin' role to proceed.
     */
    @Post('create-hospital-staff')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles('superadmin')
    async createHospitalStaff(@Body() body: any) {
        // Delegates the business logic for creating staff to the AuthService
        return this.authService.createHospitalStaff(body);
    }
}

