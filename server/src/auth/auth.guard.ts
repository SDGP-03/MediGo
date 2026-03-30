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
        // Switch context to HTTPS to access the raw request object
        const request = context.switchToHttp().getRequest();

        //    - Standard REST: Token in 'Authorization' header (Bearer scheme)
        const authHeader = request.headers['authorization'];
        const queryToken = request.query?.token;

        let token: string | undefined;

        // Extraction: Extract the raw JWT (JSON Web Token) from the preferred source
        if (authHeader && authHeader.startsWith('Bearer ')) {//heck if header has:Authorization: Bearer TOKEN
            token = authHeader.split('Bearer ')[1];//Extract only the token part
        } else if (queryToken) {//Or if token is in URL
            token = queryToken as string;
        }

        // Verification Check: Block the request immediately if no token is found
        if (!token) {
            throw new UnauthorizedException('Missing or invalid Authorization');
        }

        try {
            // Firebase Communication: Send the token to Firebase Admin SDK to verify signature and expiry
            const decodedToken = await this.firebase.getAuth().verifyIdToken(token);

            // Request Context: Attach the decoded user data (hospital ID, role, etc) to the request
            // This allows future controllers to know WHO is calling the API.
            request.user = decodedToken;
            return true;
        } catch (error) {
            // Security Logging: Log unauthorized attempts for auditing
            this.logger.warn(`Token verification failed: ${error}`);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
