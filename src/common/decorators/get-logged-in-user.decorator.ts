import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  HttpStatus,
} from '@nestjs/common';
import { UnauthorizedException } from '@rwanda360/rwanda360-service-sdk';

export const loggedInUserFactory = (data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest();

  const user = request.user;

  if (user == null) {
    throw new BadRequestException('Unauthenticated.');
  }

  return user;
};

export const loggedInUserIdFactory = (data: unknown, context: ExecutionContext): number => {
  const request = context.switchToHttp().getRequest();

  const user = request.user;

  if (user == null) {
    throw new UnauthorizedException('Unauthenticated.');
  }

  return user.sub;
};

export const GetLoggedInUserId = createParamDecorator(loggedInUserIdFactory);
export const GetLoggedInUser = createParamDecorator(loggedInUserFactory);
