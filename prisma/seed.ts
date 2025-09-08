import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create permissions
  const permissions = [
    // User permissions
    { name: 'read:users', resource: 'users', action: 'read', description: 'Read user information' },
    { name: 'write:users', resource: 'users', action: 'write', description: 'Create and update users' },
    { name: 'delete:users', resource: 'users', action: 'delete', description: 'Delete users' },
    
    // Role permissions
    { name: 'read:roles', resource: 'roles', action: 'read', description: 'Read role information' },
    { name: 'write:roles', resource: 'roles', action: 'write', description: 'Create and update roles' },
    { name: 'delete:roles', resource: 'roles', action: 'delete', description: 'Delete roles' },
    
    // Permission permissions
    { name: 'read:permissions', resource: 'permissions', action: 'read', description: 'Read permission information' },
    { name: 'write:permissions', resource: 'permissions', action: 'write', description: 'Create and update permissions' },
    { name: 'delete:permissions', resource: 'permissions', action: 'delete', description: 'Delete permissions' },
    
    // Audit log permissions
    { name: 'read:audit_logs', resource: 'audit_logs', action: 'read', description: 'Read audit logs' },
    
    // Profile permissions
    { name: 'read:profile', resource: 'profile', action: 'read', description: 'Read own profile' },
    { name: 'write:profile', resource: 'profile', action: 'write', description: 'Update own profile' },
  ];

  console.log('Creating permissions...');
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // Create roles
  console.log('Creating roles...');
  
  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Standard user role',
      isDefault: true,
    },
  });

  const moderatorRole = await prisma.role.upsert({
    where: { name: 'moderator' },
    update: {},
    create: {
      name: 'moderator',
      description: 'Moderator role with limited admin access',
      isDefault: false,
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator role with full access',
      isDefault: false,
    },
  });

  // Assign permissions to roles
  console.log('Assigning permissions to roles...');

  // User role permissions
  const userPermissions = await prisma.permission.findMany({
    where: {
      name: {
        in: ['read:profile', 'write:profile']
      }
    }
  });

  await prisma.role.update({
    where: { name: 'user' },
    data: {
      permissions: {
        connect: userPermissions.map(p => ({ id: p.id }))
      }
    }
  });

  // Moderator role permissions (includes user permissions + some admin permissions)
  const moderatorPermissions = await prisma.permission.findMany({
    where: {
      name: {
        in: [
          'read:profile', 'write:profile',
          'read:users', 'read:roles', 'read:permissions',
          'read:audit_logs'
        ]
      }
    }
  });

  await prisma.role.update({
    where: { name: 'moderator' },
    data: {
      permissions: {
        connect: moderatorPermissions.map(p => ({ id: p.id }))
      }
    }
  });

  // Admin role permissions (all permissions)
  const allPermissions = await prisma.permission.findMany();

  await prisma.role.update({
    where: { name: 'admin' },
    data: {
      permissions: {
        connect: allPermissions.map(p => ({ id: p.id }))
      }
    }
  });

  // Create default admin user
  console.log('Creating default admin user...');
  
  const hashedPassword = await bcrypt.hash('admin123!', 12);
  
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
      roles: {
        connect: { id: adminRole.id }
      }
    },
  });

  // Create email templates
  console.log('Creating email templates...');
  
  const emailTemplates = [
    {
      name: 'verification',
      subject: 'Verify Your Email Address',
      htmlContent: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">Verify Your Email Address</h2>
          <p>Thank you for signing up! Please click the button below to verify your email address:</p>
          <a href="{{verificationUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Verify Email</a>
          <p>If the button doesn't work, you can also click this link:</p>
          <p><a href="{{verificationUrl}}">{{verificationUrl}}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
      textContent: `
        Verify Your Email Address
        
        Thank you for signing up! Please visit the following link to verify your email address:
        {{verificationUrl}}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, you can safely ignore this email.
      `
    },
    {
      name: 'password_reset',
      subject: 'Reset Your Password',
      htmlContent: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          <a href="{{resetUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
          <p>If the button doesn't work, you can also click this link:</p>
          <p><a href="{{resetUrl}}">{{resetUrl}}</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      `,
      textContent: `
        Reset Your Password
        
        You requested to reset your password. Please visit the following link to set a new password:
        {{resetUrl}}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, you can safely ignore this email.
      `
    },
    {
      name: 'welcome',
      subject: 'Welcome to Our Platform!',
      htmlContent: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #333;">Welcome to Our Platform!</h2>
          <p>Hi {{firstName}},</p>
          <p>Welcome to our platform! Your account has been successfully verified and you're ready to get started.</p>
          <p>Here are some things you can do:</p>
          <ul>
            <li>Complete your profile</li>
            <li>Explore our features</li>
            <li>Connect with other users</li>
          </ul>
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          <p>Best regards,<br>The Team</p>
        </div>
      `,
      textContent: `
        Welcome to Our Platform!
        
        Hi {{firstName}},
        
        Welcome to our platform! Your account has been successfully verified and you're ready to get started.
        
        Here are some things you can do:
        - Complete your profile
        - Explore our features
        - Connect with other users
        
        If you have any questions, please don't hesitate to contact our support team.
        
        Best regards,
        The Team
      `
    }
  ];

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { name: template.name },
      update: {},
      create: template,
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log('Default admin user created: admin@example.com / admin123!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });