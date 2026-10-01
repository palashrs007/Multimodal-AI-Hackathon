import { ValidationError } from '../lib/errors.js';

export function validate(schemas = {}) {
  return async (req, res, next) => {
    try {
      if (schemas.params) {
        const result = await schemas.params.safeParseAsync(req.params);
        if (!result.success) {
          throw new ValidationError('Invalid route parameters', result.error.errors);
        }
        req.params = result.data;
      }

      if (schemas.query) {
        const result = await schemas.query.safeParseAsync(req.query);
        if (!result.success) {
          throw new ValidationError('Invalid query parameters', result.error.errors);
        }
        req.query = result.data;
      }

      if (schemas.body) {
        const result = await schemas.body.safeParseAsync(req.body);
        if (!result.success) {
          throw new ValidationError('Invalid request body', result.error.errors);
        }
        req.body = result.data;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

export default validate;
