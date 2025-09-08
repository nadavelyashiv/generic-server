import { api, type ApiResponse, type LoginRequest, type LoginResponse, type RegisterRequest, type User } from '../lib/api';

class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/api/auth/login', credentials);
    return response.data.data!;
  }

  async register(userData: RegisterRequest): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/api/auth/register', userData);
    return response.data.data!;
  }

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
    this.clearTokens();
  }

  async logoutAll(): Promise<void> {
    await api.post('/api/auth/logout-all');
    this.clearTokens();
  }

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<ApiResponse<{ accessToken: string }>>('/api/auth/refresh', {
      refreshToken,
    });
    
    const { accessToken } = response.data.data!;
    localStorage.setItem('accessToken', accessToken);
    return accessToken;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/api/users/profile');
    return response.data.data!;
  }

  async verifyEmail(token: string): Promise<void> {
    await api.post('/api/auth/verify-email', { token });
  }

  async resendVerificationEmail(): Promise<void> {
    await api.post('/api/auth/resend-verification');
  }

  async forgotPassword(email: string): Promise<void> {
    await api.post('/api/auth/forgot-password', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/reset-password', { token, newPassword });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/api/auth/change-password', { currentPassword, newPassword });
  }

  saveTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  async initiateGoogleAuth(): Promise<string> {
    const response = await api.get<ApiResponse<{ url: string }>>('/api/auth/google');
    return response.data.data!.url;
  }

  async initiateFacebookAuth(): Promise<string> {
    const response = await api.get<ApiResponse<{ url: string }>>('/api/auth/facebook');
    return response.data.data!.url;
  }
}

export const authService = new AuthService();
export default authService;