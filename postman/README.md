# Authentication Server - Postman Collection

This directory contains comprehensive Postman collections and environments for testing the Node.js Authentication Server API.

## 📁 Files

- `Auth-Server-API.postman_collection.json` - Complete API collection with all endpoints
- `Auth-Server-Development.postman_environment.json` - Development environment variables
- `Auth-Server-Production.postman_environment.json` - Production environment template

## 🚀 Quick Start

### 1. Import into Postman

1. **Import Collection:**
   - Open Postman
   - Click "Import" → "File" 
   - Select `Auth-Server-API.postman_collection.json`

2. **Import Environment:**
   - Click "Import" → "File"
   - Select `Auth-Server-Development.postman_environment.json`

3. **Select Environment:**
   - In Postman, select "Auth Server - Development" from the environment dropdown

### 2. Test Your Server

1. **Health Check:**
   - Run "Server Health Check" to verify your server is running
   - Expected: `200 OK` with server status

2. **Admin Login:**
   - Run "Admin Login" with default credentials
   - Expected: `200 OK` with access token (auto-saved to environment)

3. **Test API:**
   - Run "API Test Endpoint" to verify basic functionality
   - Expected: `200 OK` with echo response

## 📋 Collection Structure

### 🏥 Health Check
- **Server Health Check** - Verify server status
- **API Test Endpoint** - Test basic API functionality

### 🔐 Authentication
- **User Registration** - Register new users
- **User Login** - Standard email/password login
- **Admin Login** - Login with admin credentials
- **Refresh Token** - Refresh access tokens
- **Email Verification** - Verify email addresses
- **Resend Verification Email** - Resend verification
- **Forgot Password** - Request password reset
- **Reset Password** - Reset password with token
- **Change Password** - Change password (authenticated)
- **Logout** - Single session logout
- **Logout All Sessions** - Multi-device logout

### 🌐 OAuth Authentication
- **Google OAuth Initiate** - Start Google OAuth flow
- **Google OAuth Callback** - Handle Google callback
- **Facebook OAuth Initiate** - Start Facebook OAuth flow  
- **Facebook OAuth Callback** - Handle Facebook callback

### 👤 User Management
- **Get User Profile** - Get current user data
- **Update User Profile** - Update profile information
- **Delete User Account** - Delete current account
- **Get User by ID** - Get specific user (admin/self)

### 👑 Admin - User Management
- **List All Users** - Paginated user list
- **Search Users** - Filter and search users
- **Update User Status** - Enable/disable accounts
- **Assign User Roles** - Manage user roles
- **Assign User Permissions** - Manage user permissions

### 🛡️ Admin - Roles & Permissions
- **List All Roles** - Get all system roles
- **Create New Role** - Add new roles
- **Update Role** - Modify existing roles
- **Delete Role** - Remove roles
- **List All Permissions** - Get all permissions
- **Create New Permission** - Add new permissions
- **Update Permission** - Modify permissions
- **Delete Permission** - Remove permissions

### 📊 Admin - Audit Logs
- **Get Audit Logs** - System activity logs
- **Get User Activity Logs** - User-specific logs

### 🗄️ Database Queries
- **Check Database Tables** - List database tables
- **Get Database Stats** - System statistics

## 🔑 Authentication Flow

The collection uses automatic token management:

1. **Login:** Access tokens are automatically saved to environment variables
2. **Authentication:** Most requests use Bearer token authentication
3. **Token Refresh:** Use the refresh endpoint when tokens expire
4. **Environment Variables:** Tokens persist across requests

## 🌍 Environment Variables

### Development Environment
```
baseUrl: http://localhost:3000
adminEmail: admin@example.com
adminPassword: admin123!
```

### Production Environment
```
baseUrl: https://your-auth-server.com
adminEmail: admin@yourcompany.com
adminPassword: [SET_YOUR_PASSWORD]
```

### Auto-Generated Variables
- `accessToken` - JWT access token (auto-set on login)
- `refreshToken` - JWT refresh token (auto-set on login)
- `userId` - Current user ID (auto-set on login)

## 🧪 Testing Workflow

### 1. Basic API Testing
```
1. Health Check → API Test Endpoint
2. Admin Login → Get User Profile
3. List All Users → Get Database Stats
```

### 2. User Registration Flow
```
1. User Registration
2. Email Verification (check logs for token)
3. User Login
4. Get User Profile
```

### 3. Authentication Testing
```
1. User Login → Change Password
2. Logout → Login (with new password)
3. Logout All Sessions
```

### 4. Admin Operations
```
1. Admin Login
2. List All Users → Create New Role
3. Create New Permission → Assign User Roles
4. Get Audit Logs
```

## 🔧 Customization

### Adding New Endpoints
1. Create new request in appropriate folder
2. Set authentication if required
3. Add test scripts to save response data
4. Update environment variables as needed

### Environment Setup
1. Duplicate development environment
2. Update `baseUrl` for your server
3. Set appropriate credentials
4. Test with health check

## 🚨 Security Notes

- **Never commit production credentials**
- **Use environment variables for sensitive data**
- **Rotate access tokens regularly**
- **Test with non-admin users for proper authorization**

## 📝 API Response Format

All API responses follow this format:
```json
{
  "success": true/false,
  "message": "Description",
  "data": { /* Response data */ },
  "errors": [ /* Validation errors */ ],
  "timestamp": "ISO date string"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Run admin login first
   - Check if token expired (use refresh endpoint)

2. **403 Forbidden**  
   - Verify user has required permissions
   - Check if accessing admin-only endpoints

3. **Connection Refused**
   - Verify server is running on correct port
   - Check baseUrl in environment

4. **Database Errors**
   - Ensure PostgreSQL is running
   - Run database migrations if needed

### Debug Steps
1. Check server logs
2. Verify environment variables
3. Test health endpoint first
4. Use Postman Console for detailed logs

## 🔄 Continuous Testing

Set up Postman monitors to:
- Run health checks regularly
- Test critical authentication flows  
- Validate admin operations
- Monitor API performance

---

**Happy Testing!** 🎉