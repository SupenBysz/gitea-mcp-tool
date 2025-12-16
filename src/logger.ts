import pino from 'pino';

const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';

export function createLogger(name: string) {
  if (nodeEnv === 'development') {
    return pino({
      name,
      level: logLevel,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          destination: 2,
        },
      },
    });
  }

  return pino(
    {
      name,
      level: logLevel,
    },
    pino.destination(2)
  );
}
