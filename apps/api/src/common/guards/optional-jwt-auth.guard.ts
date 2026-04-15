import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    handleRequest(err: any, user: any) {
        // If error or no user, return null (allow access as guest)
        if (err || !user) {
            return null;
        }
        return user;
    }
}
