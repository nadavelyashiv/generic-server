import express from 'express';
import cors from 'cors';

const app = express();

// CORS middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Basic API endpoints
app.post('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication server is working!',
    data: req.body,
  });
});

// Mock OAuth endpoints (temporary for testing the client)
app.get('/api/auth/google', (req, res) => {
  res.json({
    success: false,
    message: 'Google OAuth not configured yet. Please set up GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables.',
    data: {
      url: 'https://accounts.google.com/oauth/authorize'
    }
  });
});

app.get('/api/auth/facebook', (req, res) => {
  res.json({
    success: false,
    message: 'Facebook OAuth not configured yet. Please set up FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in environment variables.',
    data: {
      url: 'https://www.facebook.com/v18.0/dialog/oauth'
    }
  });
});

// Mock login endpoint (temporary for testing the client)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@example.com' && password === 'admin123!') {
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: '1',
          email: 'admin@example.com',
          firstName: 'Admin',
          lastName: 'User',
          isActive: true,
          isEmailVerified: true,
          roles: [{ id: '1', name: 'admin', description: 'Administrator role' }],
          permissions: ['users:read', 'users:write', 'roles:read', 'roles:write'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        accessToken: 'mock-access-token-admin',
        refreshToken: 'mock-refresh-token-admin',
      }
    });
  } else if (email === 'user@example.com' && password === 'user123!') {
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: '2',
          email: 'user@example.com',
          firstName: 'Regular',
          lastName: 'User',
          isActive: true,
          isEmailVerified: true,
          roles: [{ id: '2', name: 'user', description: 'Regular user role' }],
          permissions: ['profile:read', 'profile:write'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        accessToken: 'mock-access-token-user',
        refreshToken: 'mock-refresh-token-user',
      }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      errors: ['Email or password is incorrect'],
      timestamp: new Date().toISOString(),
    });
  }
});

// Mock register endpoint
app.post('/api/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  res.json({
    success: true,
    message: 'User registered successfully! Please check your email for verification.',
    data: {
      id: Math.random().toString(36).substr(2, 9),
      email,
      firstName,
      lastName,
      isActive: true,
      isEmailVerified: false,
      roles: [{ id: '2', name: 'user', description: 'Regular user role' }],
      permissions: ['profile:read', 'profile:write'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  });
});

// Mock user profile endpoint
app.get('/api/users/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }
  
  const token = authHeader.substring(7);
  
  if (token === 'mock-access-token-admin') {
    res.json({
      success: true,
      data: {
        id: '1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        roles: [{ id: '1', name: 'admin', description: 'Administrator role' }],
        permissions: ['users:read', 'users:write', 'roles:read', 'roles:write'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });
  } else if (token === 'mock-access-token-user') {
    res.json({
      success: true,
      data: {
        id: '2',
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        isActive: true,
        isEmailVerified: true,
        roles: [{ id: '2', name: 'user', description: 'Regular user role' }],
        permissions: ['profile:read', 'profile:write'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
});

// Error handlers
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    errorCode: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Mock Authentication Server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Test credentials: admin@example.com / admin123! or user@example.com / user123!`);
});

export default app;