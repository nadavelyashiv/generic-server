import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@/utils/errors';

type ValidationType = 'body' | 'query' | 'params';

export const validate = (schema: z.ZodSchema, type: ValidationType = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      let data;
      
      switch (type) {
        case 'body':
          data = req.body;
          break;
        case 'query':
          data = req.query;
          break;
        case 'params':
          data = req.params;
          break;
        default:
          data = req.body;
      }

      const validatedData = schema.parse(data);
      
      // Replace the original data with validated data
      switch (type) {
        case 'body':
          req.body = validatedData;
          break;
        case 'query':
          req.query = validatedData;
          break;
        case 'params':
          req.params = validatedData;
          break;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => {
          const path = err.path.join('.');
          return `${path}: ${err.message}`;
        });
        
        throw new ValidationError('Validation failed', errors);
      }
      
      next(error);
    }
  };
};

export const validateBody = (schema: z.ZodSchema) => validate(schema, 'body');
export const validateQuery = (schema: z.ZodSchema) => validate(schema, 'query');
export const validateParams = (schema: z.ZodSchema) => validate(schema, 'params');