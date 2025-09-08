export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QueryFilters {
  search?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  roles?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplateData {
  [key: string]: string | number | boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
}

export interface AuditLogData {
  userId?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}