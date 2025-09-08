import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcrypt';
import { config } from '@/config/environment';
import prisma from '@/config/database';
import { AuthenticationError } from '@/utils/errors';
import logger from '@/utils/logger';
import { OAuthProfile } from '@/types/auth.types';

// Local Strategy for email/password authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email: string, password: string, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            roles: {
              include: {
                permissions: true,
              },
            },
            permissions: true,
          },
        });

        if (!user) {
          return done(new AuthenticationError('Invalid email or password'), false);
        }

        if (!user.password) {
          return done(
            new AuthenticationError('Please sign in using your social media account'),
            false
          );
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(new AuthenticationError('Invalid email or password'), false);
        }

        if (!user.isActive) {
          return done(new AuthenticationError('Your account has been disabled'), false);
        }

        if (!user.emailVerified) {
          return done(
            new AuthenticationError('Please verify your email address before signing in'),
            false
          );
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return done(null, user);
      } catch (error) {
        logger.error('Local strategy error:', error);
        return done(error, false);
      }
    }
  )
);

// JWT Strategy for API authentication
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwt.accessSecret,
      issuer: 'auth-server',
      audience: 'auth-client',
    },
    async (payload, done) => {
      try {
        if (payload.type !== 'access') {
          return done(new AuthenticationError('Invalid token type'), false);
        }

        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: {
            roles: {
              include: {
                permissions: true,
              },
            },
            permissions: true,
          },
        });

        if (!user) {
          return done(new AuthenticationError('User not found'), false);
        }

        if (!user.isActive) {
          return done(new AuthenticationError('User account is disabled'), false);
        }

        return done(null, user);
      } catch (error) {
        logger.error('JWT strategy error:', error);
        return done(error, false);
      }
    }
  )
);

// Google OAuth Strategy
if (config.oauth.google.clientId && config.oauth.google.clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.oauth.google.clientId,
        clientSecret: config.oauth.google.clientSecret,
        callbackURL: `${config.urls.server}/api/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const oauthProfile: OAuthProfile = {
            id: profile.id,
            email: profile.emails?.[0]?.value || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            avatar: profile.photos?.[0]?.value,
            provider: 'google',
          };

          const user = await handleOAuthLogin(oauthProfile);
          return done(null, user);
        } catch (error) {
          logger.error('Google OAuth strategy error:', error);
          return done(error, false);
        }
      }
    )
  );
}

// Facebook OAuth Strategy
if (config.oauth.facebook.appId && config.oauth.facebook.appSecret) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: config.oauth.facebook.appId,
        clientSecret: config.oauth.facebook.appSecret,
        callbackURL: `${config.urls.server}/api/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'email', 'name', 'photos'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const oauthProfile: OAuthProfile = {
            id: profile.id,
            email: profile.emails?.[0]?.value || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            avatar: profile.photos?.[0]?.value,
            provider: 'facebook',
          };

          const user = await handleOAuthLogin(oauthProfile);
          return done(null, user);
        } catch (error) {
          logger.error('Facebook OAuth strategy error:', error);
          return done(error, false);
        }
      }
    )
  );
}

// Helper function to handle OAuth login/registration
async function handleOAuthLogin(profile: OAuthProfile) {
  try {
    // Check if user exists with this OAuth provider ID
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          profile.provider === 'google' ? { googleId: profile.id } : { facebookId: profile.id },
          { email: profile.email.toLowerCase() },
        ],
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        permissions: true,
      },
    });

    if (user) {
      // Update OAuth ID if not set
      const updateData: any = {
        lastLoginAt: new Date(),
        avatar: profile.avatar || user.avatar,
      };

      if (profile.provider === 'google' && !user.googleId) {
        updateData.googleId = profile.id;
      } else if (profile.provider === 'facebook' && !user.facebookId) {
        updateData.facebookId = profile.id;
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData,
        include: {
          roles: {
            include: {
              permissions: true,
            },
          },
          permissions: true,
        },
      });
    } else {
      // Create new user
      const defaultRole = await prisma.role.findFirst({
        where: { isDefault: true },
        include: {
          permissions: true,
        },
      });

      const userData: any = {
        email: profile.email.toLowerCase(),
        firstName: profile.firstName,
        lastName: profile.lastName,
        avatar: profile.avatar,
        emailVerified: true, // OAuth emails are considered verified
        isActive: true,
        lastLoginAt: new Date(),
      };

      if (profile.provider === 'google') {
        userData.googleId = profile.id;
      } else if (profile.provider === 'facebook') {
        userData.facebookId = profile.id;
      }

      if (defaultRole) {
        userData.roles = {
          connect: { id: defaultRole.id },
        };
      }

      user = await prisma.user.create({
        data: userData,
        include: {
          roles: {
            include: {
              permissions: true,
            },
          },
          permissions: true,
        },
      });

      logger.info(`New user registered via ${profile.provider}:`, {
        userId: user.id,
        email: user.email,
      });
    }

    if (!user.isActive) {
      throw new AuthenticationError('Your account has been disabled');
    }

    return user;
  } catch (error) {
    logger.error('OAuth login handler error:', error);
    throw error;
  }
}

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        permissions: true,
      },
    });

    if (!user) {
      return done(new AuthenticationError('User not found'), null);
    }

    if (!user.isActive) {
      return done(new AuthenticationError('User account is disabled'), null);
    }

    done(null, user);
  } catch (error) {
    logger.error('Passport deserializeUser error:', error);
    done(error, null);
  }
});

export default passport;