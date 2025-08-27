// lib/logger.ts - Production-safe logging with lazy evaluation
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

// Safe evaluation of potentially expensive operations
const safeEvaluate = (value: any): any => {
  // If it's a function, only call it when we're actually logging
  if (typeof value === 'function') {
    try {
      return value();
    } catch (error) {
      return `[Error evaluating: ${error instanceof Error ? error.message : 'Unknown error'}]`;
    }
  }
  return value;
};

const formatMessage = (level: string, message: string | (() => string), meta?: any | (() => any)): string => {
  const timestamp = new Date().toISOString();
  const evaluatedMessage = typeof message === 'function' ? safeEvaluate(message) : message;
  const baseMessage = `[${timestamp}] ${level}: ${evaluatedMessage}`;
  
  if (meta !== undefined) {
    const evaluatedMeta = typeof meta === 'function' ? safeEvaluate(meta) : meta;
    if (evaluatedMeta && typeof evaluatedMeta === 'object') {
      try {
        return `${baseMessage} ${JSON.stringify(evaluatedMeta, null, 2)}`;
      } catch (error) {
        return `${baseMessage} [Circular or non-serializable object]`;
      }
    }
    return `${baseMessage} ${evaluatedMeta}`;
  }
  
  return baseMessage;
};

// Type for lazy evaluation support
type LogValue = string | (() => string);
type MetaValue = any | (() => any);

export const logger = {
  error: (message: LogValue, meta?: MetaValue) => {
    if (shouldLog(LOG_LEVELS.ERROR)) {
      console.error(formatMessage('ERROR', message, meta));
    }
  },
  
  warn: (message: LogValue, meta?: MetaValue) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      console.warn(formatMessage('WARN', message, meta));
    }
  },
  
  info: (message: LogValue, meta?: MetaValue) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      console.info(formatMessage('INFO', message, meta));
    }
  },
  
  debug: (message: LogValue, meta?: MetaValue) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(formatMessage('DEBUG', message, meta));
    }
  },
  
  // Development-only logging - completely removed in production
  dev: (message: LogValue, meta?: MetaValue) => {
    if (process.env.NODE_ENV !== 'production') {
      // Only evaluate if we're in development
      const evaluatedMessage = typeof message === 'function' ? safeEvaluate(message) : message;
      const evaluatedMeta = meta !== undefined ? 
        (typeof meta === 'function' ? safeEvaluate(meta) : meta) : '';
      console.log(`[DEV] ${evaluatedMessage}`, evaluatedMeta);
    }
  },
  
  // Group logging for related messages
  group: (label: string, fn: () => void) => {
    if (process.env.NODE_ENV !== 'production') {
      console.group(label);
      try {
        fn();
      } finally {
        console.groupEnd();
      }
    }
  },
  
  // Performance timing utility
  time: (label: string, fn: () => any) => {
    if (process.env.NODE_ENV !== 'production') {
      const start = performance.now();
      const result = fn();
      const end = performance.now();
      console.log(`⏱️ ${label}: ${Math.round(end - start)}ms`);
      return result;
    }
    return fn();
  },
};

export default logger;