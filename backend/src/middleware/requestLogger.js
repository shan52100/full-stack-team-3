import CallLog from '../models/CallLog.js';

// Logs all API requests for debugging/auditing
export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
      );
    }
  });

  next();
}

// Log voice call events to the database
export async function logCallEvent(eventData) {
  try {
    const log = new CallLog(eventData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Failed to log call event:', error.message);
    return null;
  }
}
