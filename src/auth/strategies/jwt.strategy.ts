// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // First, try to extract from cookie
        (request: Request) => {
          return request?.cookies?.access_token;
        },
        // Fallback to Authorization header for API clients
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      // The ! at the end tells TypeScript "I guarantee this is not undefined"
      // It will crash at runtime if JWT_ACCESS_SECRET is missing from .env,
      // which is exactly what you want — fail loud, fail early.
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

async validate(payload: { sub: string; email: string; role: string; business_id: string | null }): Promise<any> {
  // Fetch user to verify they still exist
  const user = await this.usersService.findById(payload.sub);
  if (!user) {
    return null;
  }
  
  // Return user object with business_id from JWT payload
  // This ensures business_id is always available even though it's not in the User entity
  const userWithBusinessId = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    is_verified: user.is_verified,
    is_suspended: user.is_suspended,
    avatarUrl: user.avatarUrl,
    jobTitle: user.jobTitle,
    preferredLanguage: user.preferredLanguage,
    timezone: user.timezone,
    messageColor: user.messageColor,
    created_at: user.created_at,
    updated_at: user.updated_at,
    business_id: payload.business_id, // From JWT payload, not DB
  };
  
  return userWithBusinessId;
}
}