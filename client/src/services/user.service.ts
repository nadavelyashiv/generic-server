import { api, type ApiResponse, type User } from '../lib/api';

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UserSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface UpdateUserStatusRequest {
  isActive: boolean;
}

export interface AssignRolesRequest {
  roleIds: string[];
}

class UserService {
  async getUsers(params: UserSearchParams = {}): Promise<UserListResponse> {
    const response = await api.get<ApiResponse<UserListResponse>>('/api/admin/users', { params });
    return response.data.data!;
  }

  async getUserById(id: string): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/api/admin/users/${id}`);
    return response.data.data!;
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    const response = await api.put<ApiResponse<User>>(`/api/admin/users/${id}`, userData);
    return response.data.data!;
  }

  async updateUserStatus(id: string, statusData: UpdateUserStatusRequest): Promise<User> {
    const response = await api.patch<ApiResponse<User>>(`/api/admin/users/${id}/status`, statusData);
    return response.data.data!;
  }

  async assignUserRoles(id: string, rolesData: AssignRolesRequest): Promise<User> {
    const response = await api.post<ApiResponse<User>>(`/api/admin/users/${id}/roles`, rolesData);
    return response.data.data!;
  }

  async removeUserRole(userId: string, roleId: string): Promise<User> {
    const response = await api.delete<ApiResponse<User>>(`/api/admin/users/${userId}/roles/${roleId}`);
    return response.data.data!;
  }

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/api/admin/users/${id}`);
  }

  async updateProfile(userData: UpdateUserRequest): Promise<User> {
    const response = await api.put<ApiResponse<User>>('/api/users/profile', userData);
    return response.data.data!;
  }

  async deleteAccount(): Promise<void> {
    await api.delete('/api/users/profile');
  }
}

export const userService = new UserService();
export default userService;