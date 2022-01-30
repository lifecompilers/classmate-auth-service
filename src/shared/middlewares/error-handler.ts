import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/bad-request-error';
import { CustomError } from '../errors/custom-error';
import { InvalidCredentialsError } from '../errors/InvalidCredentialsError';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error("ERROR ----- ", err);
  if (err instanceof InvalidCredentialsError) {
    return res.render('login', { locals: { errorMessage: err.message } });
  }
  if (err instanceof CustomError) {
    return res.status(err.statusCode).send({ errors: err.serializeErrors() });
  }
  let error: CustomError | undefined;
  if (err && err.code === 11000) {
    error = handleDuplicateDBColumnError(err);
  }
  if (error) {
    return res.status(error.statusCode).send({ errors: error.serializeErrors() });
  }
  if (err.message === "jwt expired") {
    return res.status(401).send({
      errors: [{ message: 'Token Expired' }]
    });
  }
  res.status(err.status || 500).send({
    errors: [{ message: err.message || 'Internal server error, try again later', stackTrace: err }]
  });
};

const handleDuplicateDBColumnError = (err: any) => {
  let message = "Duplicate " + Object.keys(err.keyValue).reduce((acc, key) => {
    if (acc) {
      acc += `, ${key} ${err.keyValue[key]}`;
    } else {
      acc += `${key} ${err.keyValue[key]}`;
    }
    return acc;
  }, '');
  return new BadRequestError(message);
}