import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EntityManager } from 'typeorm';
import { User } from '../../../database/entities/1_user.entity';
import { AuthenticatedUser, JwtPayload } from '../types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly entityManager: EntityManager,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.entityManager.findOne(User, {
      where: { id: payload.sub },
      select: ['id', 'email'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const authenticatedUser: AuthenticatedUser = {
      sub: Number(user.id),
      email: user.email,
    };

    return authenticatedUser;
  }
}
