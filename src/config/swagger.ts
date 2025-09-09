import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './environment';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Node.js Authentication Server API',
      version: '2.0.0',
      description: `
        A comprehensive authentication server with JWT tokens, OAuth integration, RBAC, and user management.
        
        ## Features
        - JWT Authentication with Access/Refresh Token Pattern
        - Role-Based Access Control (Admin, Moderator, User)
        - OAuth Integration (Google, Facebook)
        - Email Verification Workflow
        - Password Management (Reset, Change)
        - Admin User Management
        - User Profile Management
        - Rate Limiting with Redis/Memory fallback
        
        ## Getting Started
        1. Register a new user or login with existing credentials
        2. Use the received access token for authenticated requests
        3. Admin users can access user management endpoints
        4. All endpoints return consistent JSON responses
        
        ## Authentication
        Most endpoints require authentication. Include the JWT token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: config.server.nodeEnv === 'production' 
          ? 'https://your-auth-server.com' 
          : `http://localhost:${config.server.port}`,
        description: config.server.nodeEnv === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login endpoint'
        }
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indicates if the request was successful'
            },
            message: {
              type: 'string',
              description: 'Human-readable message describing the result'
            },
            data: {
              type: 'object',
              description: 'Response data (varies by endpoint)'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'ISO timestamp of the response'
            }
          },
          required: ['success', 'timestamp']
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errorCode: {
              type: 'string',
              description: 'Machine-readable error code'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['success', 'message', 'timestamp']
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user account is active'
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Whether the user email is verified'
            },
            roles: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Role'
              },
              description: 'User roles'
            },
            permissions: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Flattened list of user permissions'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Role: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique role identifier'
            },
            name: {
              type: 'string',
              description: 'Role name'
            },
            permissions: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Permission'
              }
            }
          }
        },
        Permission: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique permission identifier'
            },
            name: {
              type: 'string',
              description: 'Permission name'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              description: 'User password'
            }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'firstName', 'lastName'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'User password (minimum 8 characters)'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Login successful'
            },
            data: {
              type: 'object',
              properties: {
                accessToken: {
                  type: 'string',
                  description: 'JWT access token'
                },
                refreshToken: {
                  type: 'string',
                  description: 'JWT refresh token'
                },
                user: {
                  $ref: '#/components/schemas/User'
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        PaginatedUsersResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Users retrieved successfully'
            },
            data: {
              type: 'object',
              properties: {
                users: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/User'
                  }
                },
                total: {
                  type: 'number',
                  description: 'Total number of users'
                },
                page: {
                  type: 'number',
                  description: 'Current page number'
                },
                limit: {
                  type: 'number',
                  description: 'Number of users per page'
                },
                totalPages: {
                  type: 'number',
                  description: 'Total number of pages'
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Server health and status endpoints'
      },
      {
        name: 'Authentication',
        description: 'User authentication and token management'
      },
      {
        name: 'Password Management',
        description: 'Password reset and change operations'
      },
      {
        name: 'Email Verification',
        description: 'Email verification and resend operations'
      },
      {
        name: 'OAuth',
        description: 'OAuth authentication with external providers'
      },
      {
        name: 'User Profile',
        description: 'User profile management (self-service)'
      },
      {
        name: 'Admin - User Management',
        description: 'Administrative user management operations'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts'
  ]
};

const specs = swaggerJsdoc(options);

export default specs;