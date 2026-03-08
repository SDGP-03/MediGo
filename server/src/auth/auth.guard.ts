import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

/**
 * AuthGuard verifies Firebase ID tokens from the Authorization header.
 * Usage: @UseGuards(AuthGuard) on controllers or individual routes.
 * The decoded token is attached to request.user
 */
@Injectable()
export class AuthGuard implements CanActivate {
    private readonly logger = new Logger(AuthGuard.name);

    constructor(private readonly firebase: FirebaseService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];
        const queryToken = request.query?.token;

        let token: string | undefined;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split('Bearer ')[1];
        } else if (queryToken) {
            // SSE connections use query param since EventSource doesn't support headers
            token = queryToken as string;
        }

        if (!token) {
            throw new UnauthorizedException('Missing or invalid Authorization');
        }

        try {
            const decodedToken = await this.firebase.getAuth().verifyIdToken(token);
            request.user = decodedToken;
            return true;
        } catch (error) {
            this.logger.warn(`Token verification failed: ${error}`);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
