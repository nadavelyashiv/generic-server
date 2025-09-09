# Node.js Authentication Server - Postman Collection

This directory contains comprehensive Postman collections and environments for testing the Node.js Authentication Server API with full admin and user management capabilities.

## 📋 Files Overview

- **`Auth-Server-API.postman_collection.json`** - Complete API collection (v2.0.0)
- **`Auth-Server-Development.postman_environment.json`** - Development environment (localhost:3000)
- **`Auth-Server-Production.postman_environment.json`** - Production environment template
- **`IMPORT_GUIDE.md`** - Step-by-step import instructions

## 🚀 Quick Start

1. Import the collection and environment files into Postman
2. Select the "Auth Server - Development" environment
3. Start with the "Login User" request to get authentication tokens
4. All subsequent requests will automatically use the stored access token

## 📚 API Endpoints

### 🔍 Health Check
- **GET** `/health` - Server health status

### 🔐 Authentication
- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login with credentials
- **POST** `/api/auth/refresh` - Refresh access token
- **POST** `/api/auth/logout` - Logout (invalidate refresh token)
- **POST** `/api/auth/logout-all` - Logout from all devices *(requires auth)*

### 🔑 Password Management
- **POST** `/api/auth/forgot-password` - Send password reset email
- **POST** `/api/auth/reset-password` - Reset password with token
- **POST** `/api/auth/change-password` - Change password *(requires auth)*

### 📧 Email Verification
- **GET** `/api/auth/verify-email` - Verify email with token
- **POST** `/api/auth/resend-verification` - Resend verification email

### 🌐 OAuth Authentication
- **GET** `/api/auth/google` - Google OAuth flow
- **GET** `/api/auth/facebook` - Facebook OAuth flow

### 👤 User Profile Management *(requires auth)*
- **GET** `/api/user/profile` - Get current user profile
- **PATCH** `/api/user/profile` - Update user profile
- **PATCH** `/api/user/password` - Change user password
- **DELETE** `/api/user/account` - Delete user account

### 🛡️ Admin - User Management *(requires admin/moderator role)*
- **GET** `/api/admin/users` - Get all users (with pagination & filtering)
- **GET** `/api/admin/users/:id` - Get user by ID
- **PATCH** `/api/admin/users/:id` - Update user *(admin only)*
- **PATCH** `/api/admin/users/:id/status` - Update user status *(admin only)*
- **PUT** `/api/admin/users/:id/roles` - Assign user roles *(admin only)*
- **DELETE** `/api/admin/users/:userId/roles/:roleId` - Remove user role *(admin only)*
- **DELETE** `/api/admin/users/:id` - Delete user *(admin only)*

## 🔄 Auto-Token Management

The collection includes automatic token management:

### Login Flow
1. **Login User** request automatically stores `accessToken`, `refreshToken`, and `userId`
2. All authenticated requests automatically use the stored `accessToken`
3. **Refresh Tokens** request updates stored tokens
4. **Get All Users** request stores `adminUserId` for admin operations

### Pre-request Scripts
- Automatic Authorization header injection
- Token validation and refresh logic

### Test Scripts
- Automatic token extraction from responses
- User ID capture for subsequent requests
- Response validation

## 🌍 Environment Variables

### Development Environment (`localhost:3000`)
```json
{
  "baseUrl": "http://localhost:3000",
  "environment": "development",
  "accessToken": "", // Auto-populated
  "refreshToken": "", // Auto-populated
  "userId": "", // Auto-populated
  "adminUserId": "", // Auto-populated
  "adminEmail": "admin@example.com",
  "adminPassword": "admin123!",
  "testUserEmail": "user@example.com",
  "testUserPassword": "SecurePassword123!"
}
```

### Production Environment
```json
{
  "baseUrl": "https://your-auth-server.com",
  "environment": "production",
  // ... other variables (empty for security)
}
```

## 🔧 Server Configuration

The collection is configured for the current server setup:

### Recent Changes (v2.0.0)
- ✅ **Redis Authentication Issues Fixed** - Rate limiting uses memory fallback in development
- ✅ **New Admin Endpoints** - Complete user management API
- ✅ **New User Profile Endpoints** - Self-service profile management
- ✅ **RBAC Authorization** - Role-based access control implemented
- ✅ **Auto Token Management** - Seamless authentication flow
- ✅ **Comprehensive Filtering** - User search, pagination, and filtering

### Server Status
- **Port**: 3000
- **Database**: PostgreSQL (connected)
- **Redis**: Available with memory fallback
- **Rate Limiting**: Memory-based in development
- **Authentication**: JWT with refresh tokens
- **Authorization**: Role-based access control

## 🧪 Testing Workflow

### 1. Basic Authentication Test
```
1. Health Check → 200 OK
2. Register User → 201 Created
3. Login User → 200 OK (tokens stored)
4. Get User Profile → 200 OK
```

### 2. Admin Operations Test
```
1. Login as Admin → 200 OK
2. Get All Users → 200 OK (adminUserId stored)
3. Update User Status → 200 OK
4. Assign User Roles → 200 OK
```

### 3. Password Management Test
```
1. Forgot Password → 200 OK
2. Change Password (authenticated) → 200 OK
3. Login with New Password → 200 OK
```

## 🔒 Security Features

- **JWT Authentication** with access/refresh token pattern
- **Role-Based Access Control** (Admin, Moderator, User)
- **Rate Limiting** with Redis/Memory fallback
- **Password Hashing** with bcrypt
- **Email Verification** workflow
- **OAuth Integration** (Google, Facebook)
- **Request Validation** with comprehensive schemas
- **Error Handling** with proper HTTP status codes

## 📝 Request Examples

### Login Request
```json
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "admin123!"
}
```

### Admin Get Users Request
```http
GET /api/admin/users?page=1&limit=10&search=john&role=user&isActive=true
Authorization: Bearer {{accessToken}}
```

### Update User Status Request
```json
PATCH /api/admin/users/:id/status
Authorization: Bearer {{accessToken}}
{
  "isActive": false
}
```

## 🚨 Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_TYPE",
  "timestamp": "2025-09-09T14:37:00.000Z"
}
```

## 📊 Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-09-09T14:37:00.000Z"
}
```

## 🔄 Keeping Updated

This collection will be automatically updated whenever:
- New endpoints are added
- Request/response schemas change
- Authentication methods change
- Environment configuration changes

**Current Version**: 2.0.0 (Updated: September 9, 2025)

## 🆘 Support

If you encounter issues:
1. Check server status at `http://localhost:3000/health`
2. Verify environment selection in Postman
3. Ensure authentication tokens are valid
4. Check server logs for detailed error information

For development support, refer to the server logs and ensure all dependencies are properly configured.

---

**Happy Testing!** 🎉