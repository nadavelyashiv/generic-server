# Node.js Authentication Server

A production-ready authentication server built with Node.js, TypeScript, Express.js, and PostgreSQL. Features JWT tokens, OAuth integration, RBAC permissions, and comprehensive security measures.

## 🚀 Features

- **Multiple Authentication Methods**
  - Email/password with secure requirements
  - Google OAuth 2.0
  - Facebook OAuth
  - Email verification system
  
- **JWT Token Management**
  - Access tokens (15-minute expiry)
  - Refresh tokens (7-day expiry)
  - Token blacklisting for logout
  - Secure HttpOnly cookie storage

- **Role-Based Access Control (RBAC)**
  - Flexible permission system
  - Role hierarchy support
  - Resource-action pattern permissions
  - Dynamic permission checking

- **Security Features**
  - Password hashing with bcrypt
  - Rate limiting (global & endpoint-specific)
  - CORS configuration
  - Helmet security headers
  - Input validation with Zod
  - SQL injection protection

- **Email Integration**
  - Email verification
  - Password reset emails
  - Template system
  - SMTP configuration

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+ (for sessions/rate limiting)
- SMTP server (for emails)

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd auth-server
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment configuration**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/auth_server"

# JWT Secrets (Generate strong secrets in production)
JWT_ACCESS_SECRET="your-super-secret-jwt-access-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key-change-this-in-production"
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# Server
PORT=3000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
FACEBOOK_APP_ID="your-facebook-app-id"
FACEBOOK_APP_SECRET="your-facebook-app-secret"

# Email (Optional but recommended)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
FROM_EMAIL="noreply@yourapp.com"
```

4. **Database setup**
```bash
# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed database with default data
npm run db:seed
```

5. **Start the server**
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🐳 Docker Deployment

1. **Using Docker Compose (Recommended)**
```bash
# Start all services (PostgreSQL, Redis, App)
docker compose up -d
# or using npm script:
npm run docker:up

# Stop all services
docker compose down
# or using npm script:
npm run docker:down
```

2. **Manual Docker build**
```bash
# Build image
npm run docker:build

# Run with external databases
docker run -p 3000:3000 --env-file .env auth-server
```

## 📡 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": "clp123...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "emailVerified": false,
      "isActive": true
    }
  }
}
```

#### POST `/api/auth/login`
Authenticate with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "clp123...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["user"]
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/refresh`
Refresh access token using refresh token.

**Request:** (refresh token from cookie or body)
**Response:** New access token

#### POST `/api/auth/logout`
Logout and invalidate tokens.

#### GET `/api/auth/verify-email?token=<token>`
Verify email address with token from email.

#### POST `/api/auth/forgot-password`
Request password reset email.

#### POST `/api/auth/reset-password`
Reset password with token from email.

### OAuth Endpoints

- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/facebook` - Initiate Facebook OAuth
- `GET /api/auth/facebook/callback` - Facebook OAuth callback

## 🔐 Permission System

The server implements a flexible RBAC system with the following structure:

### Default Roles
- **user**: Basic user permissions
- **moderator**: Limited admin permissions
- **admin**: Full system access

### Permission Format
Permissions follow the pattern: `action:resource`

Examples:
- `read:users` - Can read user data
- `write:posts` - Can create/edit posts
- `delete:comments` - Can delete comments

### Using Permissions in Routes
```typescript
import { hasPermission, hasRole } from '@/middleware/permission.middleware';

// Require specific permission
router.get('/admin/users', authenticate, hasPermission('read:users'), controller);

// Require specific role
router.delete('/admin/users/:id', authenticate, hasRole('admin'), controller);

// Allow owner or admin
router.put('/users/:id', authenticate, isSelfOrHasRole('admin'), controller);
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📊 Monitoring & Health Checks

- **Health Check**: `GET /health`
- **Logs**: Structured logging with Winston
- **Request IDs**: Each request gets a unique ID for tracing

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `JWT_ACCESS_SECRET` | Secret for access tokens | - | ✅ |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | - | ✅ |
| `SESSION_SECRET` | Session secret | - | ✅ |
| `PORT` | Server port | 3000 | ❌ |
| `NODE_ENV` | Environment mode | development | ❌ |
| `REDIS_URL` | Redis connection string | redis://localhost:6379 | ❌ |
| `SMTP_HOST` | Email server host | - | ❌ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - | ❌ |
| `FACEBOOK_APP_ID` | Facebook app ID | - | ❌ |

## 🚀 Production Deployment

### Security Checklist
- [ ] Use strong, unique secrets for JWT and sessions
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up proper database backups
- [ ] Enable monitoring and alerting
- [ ] Review rate limiting settings
- [ ] Configure proper log retention

### Performance Tips
- Use Redis for session storage and rate limiting
- Enable database connection pooling
- Implement proper caching strategies
- Monitor memory usage and optimize queries

## 🤝 Default Admin Account

After seeding, you can login with:
- **Email**: admin@example.com
- **Password**: admin123!

**⚠️ Change this password immediately in production!**

## 📄 License

MIT License - see LICENSE file for details.

## 🐛 Issue Reporting

Found a bug? Please create an issue with:
1. Environment details
2. Steps to reproduce
3. Expected vs actual behavior
4. Relevant logs/screenshots