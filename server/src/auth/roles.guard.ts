import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

/**
 * Guard that handles Role-Based Access Control (RBAC).
 * It checks if the current user has the necessary roles to access a specific route.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    /**
     * Determines if the current request can proceed based on user roles.
     * @param context The execution context of the request.
     * @returns boolean indicating if access is granted.
     */
    canActivate(context: ExecutionContext): boolean {
        // Retrieve the required roles metadata from the handler (method) or class (controller)
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // If no roles are specified for the route, allow access by default
        if (!requiredRoles) {
            return true;
        }

        // Extract the user object from the HTTP request
        // Note: The AuthGuard must run before this to populate the request.user object
        const { user } = context.switchToHttp().getRequest();

        // If user is missing or doesn't have a role, deny access
        if (!user || !user.role) {
            return false;
        }

        // Grant access if the user's role matches any of the required roles
        return requiredRoles.includes(user.role);
    }
}

