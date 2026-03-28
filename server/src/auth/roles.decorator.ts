import { SetMetadata } from '@nestjs/common';

// The key used to store and retrieve role metadata via Reflector
export const ROLES_KEY = 'roles';

/**
 * Custom decorator to specify which roles are allowed to access a route.
 * Usage: @Roles('admin', 'driver')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

