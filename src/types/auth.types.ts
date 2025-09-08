export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  type: 'access' | 'refresh';
}

export interface JWTTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface OAuthProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  provider: 'google' | 'facebook';
}

export interface UserWithRolesAndPermissions {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  roles: Array<{
    id: string;
    name: string;
    permissions: Array<{
      id: string;
      name: string;
      resource: string;
      action: string;
    }>;
  }>;
  permissions: Array<{
    id: string;
    name: string;
    resource: string;
    action: string;
  }>;
}