import { CustomError } from './custom-error';

export class ForbiddenAccessError extends CustomError {
  statusCode = 403;

  constructor() {
    super('Forbidden');

    Object.setPrototypeOf(this, ForbiddenAccessError.prototype);
  }

  serializeErrors() {
    return [{ message: 'Forbidden' }];
  }
}
