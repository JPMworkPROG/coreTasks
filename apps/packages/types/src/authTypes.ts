export enum AuthRequestsRPCMessage {
  Register = 'auth.register',
  Login = 'auth.login',
  Refresh = 'auth.refresh',
  ForgotPassword = 'auth.forgot-password',
  ResetPassword = 'auth.reset-password',
}

export type JwtPayload = {
  id?: string;
  sub: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}