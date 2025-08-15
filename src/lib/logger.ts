// lib/logger.ts - Production-safe logging
interface LogLevel {
  ERROR: 0;
  WARN: 1;
  INFO: 2;
  DEBUG: 3;
}

const LOG_LEVELS: LogLevel = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const getCurrentLevel = (): number => {
  if (process.env.NODE_ENV === 'production') return LOG_LEVELS.ERROR;
  if (process.env.NODE_ENV === 'test') return LOG_LEVELS.WARN;
  return LOG_LEVELS.DEBUG;
};

const shouldLog = (level: number): boolean => {
  return level <= getCurrentLevel();
};

const formatMessage = (level: string, message: string, meta?: any): string => {
  const timestamp = new Date().toISOString();
  const baseMessage = `[${timestamp}] ${level}: ${message}`;
  
  if (meta && typeof meta === 'object') {
    return `${baseMessage} ${JSON.stringify(meta, null, 2)}`;
  }
  
  return baseMessage;
};

export const logger = {
  error: (message: string, meta?: any) => {
    if (shouldLog(LOG_LEVELS.ERROR)) {
      console.error(formatMessage('ERROR', message, meta));
    }
  },
  
  warn: (message: string, meta?: any) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },
  
  info: (message: string, meta?: any) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      console.info(formatMessage('INFO', message, meta));
    }
  },
  
  debug: (message: string, meta?: any) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(formatMessage('DEBUG', message, meta));
    }
  },
  
  // Development-only logging - completely removed in production
  dev: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] ${message}`, meta ? meta : '');
    }
  },
};

export default logger;