import pino from 'pino';
import cron from 'node-cron';
import { AppError } from '../middlewares/errors/AppError';
import { Op } from 'sequelize';

let Logs: any;
let logsInitialized = false;

// Promesa para esperar la inicialización del modelo Logs
const initializeLogs = import('../models/Logs.js')
  .then(({ Logs: LogsModel }) => {
    Logs = LogsModel;
    logsInitialized = true;
  })
  .catch((error) => {
    console.error('Error importing Logs model:', error);
  });

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
      translateTime: 'yyyy-mm-dd HH:MM:ss',
    },
  },
});

const dbLogger = {
  info: (message: string, meta?: object) => {
    logger.info(message, meta);
    saveLogToDatabase('info', message, meta);
  },
  warn: (message: string, meta?: object) => {
    logger.warn(message, meta);
    saveLogToDatabase('warn', message, meta);
  },
  error: (message: string, meta?: object) => {
    logger.error(message, meta);
    saveLogToDatabase('error', message, meta);
  },
};

const originalError = logger.error.bind(logger);
logger.error = (error: unknown, message?: string) => {
  const err =
    error instanceof AppError
      ? { status: error.status, message: error.message }
      : { status: 500, message: 'InternalServerError' };
  originalError(err, message || 'An error occurred');
};

const saveLogToDatabase = async (level: string, message: string, meta?: object) => {
  try {
    // Espera a que Logs esté inicializado si aún no lo está
    if (!logsInitialized) {
      await initializeLogs;
    }
    // Verifica que Logs esté definido antes de usarlo
    if (Logs) {
      await Logs.create({ level, message, meta });
    } else {
      console.warn('Logs model not initialized, skipping database save.');
    }
  } catch (error) {
    console.error('Error saving log to database:', error);
  }
};

// Solo programa el cron si no estamos en entorno de test
if (process.env.NODE_ENV !== 'test') {
  cron.schedule('0 0 * * *', async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const deletedLogs = await Logs.destroy({
        where: {
          timestamp: { [Op.lte]: oneWeekAgo },
        },
      });

      dbLogger.info(`[CRON] Logs cleanup executed at 00:00. Deleted ${deletedLogs} logs older than one week.`);
    } catch (error) {
      dbLogger.error('[CRON] Error in cron job deleting old logs:', { error });
    }
  });
  dbLogger.info('Cron job scheduled for log cleanup (retention: 7 days).');
} else {
  dbLogger.info('Cron job not scheduled in test environment.');
}

export default dbLogger;