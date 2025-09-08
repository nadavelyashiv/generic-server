const express = require('express');
const cors = require('cors');

const app = express();

// CORS middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
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

// Mock admin user management endpoints
app.get('/api/admin/users', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }
  
  const token = authHeader.substring(7);
  
  // Only allow admin tokens to access user management
  if (token !== 'mock-access-token-admin') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions. Admin access required.',
      timestamp: new Date().toISOString(),
    });
  }

  // Mock user list with pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';

  const mockUsers = [
    {
      id: '1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true,
      isEmailVerified: true,
      roles: [{ id: '1', name: 'admin', description: 'Administrator role' }],
      permissions: ['users:read', 'users:write', 'roles:read', 'roles:write'],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      email: 'user@example.com',
      firstName: 'Regular',
      lastName: 'User',
      isActive: true,
      isEmailVerified: true,
      roles: [{ id: '2', name: 'user', description: 'Regular user role' }],
      permissions: ['profile:read', 'profile:write'],
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      email: 'moderator@example.com',
      firstName: 'Mod',
      lastName: 'Erator',
      isActive: true,
      isEmailVerified: true,
      roles: [{ id: '3', name: 'moderator', description: 'Moderator role' }],
      permissions: ['users:read', 'content:moderate'],
      createdAt: '2024-01-03T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: '4',
      email: 'inactive@example.com',
      firstName: 'Inactive',
      lastName: 'User',
      isActive: false,
      isEmailVerified: false,
      roles: [{ id: '2', name: 'user', description: 'Regular user role' }],
      permissions: ['profile:read'],
      createdAt: '2024-01-04T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    }
  ];

  // Filter users by search term
  let filteredUsers = mockUsers;
  if (search) {
    filteredUsers = mockUsers.filter(user => 
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
    );
  }

  const total = filteredUsers.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const users = filteredUsers.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      users,
      total,
      page,
      limit,
      totalPages
    }
  });
});

// Mock user status update endpoint
app.patch('/api/admin/users/:id/status', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }
  
  const token = authHeader.substring(7);
  
  if (token !== 'mock-access-token-admin') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions. Admin access required.',
      timestamp: new Date().toISOString(),
    });
  }

  const userId = req.params.id;
  const { isActive } = req.body;

  // Mock response - in a real app, you'd update the database
  res.json({
    success: true,
    message: `User ${userId} status updated to ${isActive ? 'active' : 'inactive'}`,
    data: {
      id: userId,
      email: `user${userId}@example.com`,
      firstName: 'Updated',
      lastName: 'User',
      isActive,
      isEmailVerified: true,
      roles: [{ id: '2', name: 'user', description: 'Regular user role' }],
      permissions: ['profile:read', 'profile:write'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  });
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
  console.log(`\n📝 Test credentials:`);
  console.log(`   Admin: admin@example.com / admin123!`);
  console.log(`   User:  user@example.com / user123!`);
});

module.exports = app;