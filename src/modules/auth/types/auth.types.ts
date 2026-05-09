export type JwtPayload = {
  sub: number;
};

export type AuthenticatedUser = {
  sub: number;
  email: string;
};
