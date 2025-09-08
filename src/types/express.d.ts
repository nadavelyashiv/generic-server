import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User & {
        roles: Array<{
          id: string;
          name: string;
          permissions: Array<{
            id: string;
            name: string;
            resource: string;
            action: string;
          }>;
        }>;
        permissions: Array<{
          id: string;
          name: string;
          resource: string;
          action: string;
        }>;
      };
      requestId?: string;
    }
  }
}