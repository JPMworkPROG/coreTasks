export enum AuthRequestsRPCMessage {
  Register = 'auth.register',
  Login = 'auth.login',
  Refresh = 'auth.refresh',
  ForgotPassword = 'auth.forgot-password',
  ResetPassword = 'auth.reset-password',
  GetUserById = 'auth.get-user-by-id',
}

export type JwtPayload = {
  sub: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}