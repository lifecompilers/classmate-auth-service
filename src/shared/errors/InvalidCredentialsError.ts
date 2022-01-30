import { CustomError } from './custom-error';

export class InvalidCredentialsError extends CustomError {
  statusCode = 401;

  constructor(public message: string) {
    super(message);

    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message }];
  }
}
