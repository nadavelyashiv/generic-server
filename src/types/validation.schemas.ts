import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    ),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    ),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    ),
});

export const UpdateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name contains invalid characters')
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name contains invalid characters')
    .optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const UserFiltersSchema = z.object({
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  emailVerified: z.coerce.boolean().optional(),
  roles: z.array(z.string()).optional(),
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
});

export const CreateRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(50, 'Role name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Role name can only contain letters, numbers, hyphens, and underscores'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
  isDefault: z.boolean().default(false),
  permissions: z.array(z.string()).optional(),
});

export const UpdateRoleSchema = CreateRoleSchema.partial();

export const CreatePermissionSchema = z.object({
  name: z
    .string()
    .min(1, 'Permission name is required')
    .max(100, 'Permission name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9_:-]+$/, 'Permission name can only contain letters, numbers, hyphens, underscores, and colons'),
  resource: z
    .string()
    .min(1, 'Resource is required')
    .max(50, 'Resource must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Resource can only contain letters, numbers, hyphens, and underscores'),
  action: z
    .string()
    .min(1, 'Action is required')
    .max(50, 'Action must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Action can only contain letters, numbers, hyphens, and underscores'),
  description: z.string().max(200, 'Description must be less than 200 characters').optional(),
});

export const UpdatePermissionSchema = CreatePermissionSchema.partial();

export const AssignRolesSchema = z.object({
  roleIds: z.array(z.string().cuid('Invalid role ID')).min(1, 'At least one role must be provided'),
});

export const AssignPermissionsSchema = z.object({
  permissionIds: z.array(z.string().cuid('Invalid permission ID')).min(1, 'At least one permission must be provided'),
});

export const UpdateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type UserFiltersInput = z.infer<typeof UserFiltersSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type CreatePermissionInput = z.infer<typeof CreatePermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof UpdatePermissionSchema>;
export type AssignRolesInput = z.infer<typeof AssignRolesSchema>;
export type AssignPermissionsInput = z.infer<typeof AssignPermissionsSchema>;
export type UpdateUserStatusInput = z.infer<typeof UpdateUserStatusSchema>;