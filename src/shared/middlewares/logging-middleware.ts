import winston from 'winston';
import expressWinston from 'express-winston';

const loggingMiddleware = expressWinston.logger({
    transports: [
        new winston.transports.Console(),
    ],
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
    ),
    meta: true,
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true,
    colorize: true,
    ignoreRoute: function (req, res) { return false; }
});

export default loggingMiddleware;
