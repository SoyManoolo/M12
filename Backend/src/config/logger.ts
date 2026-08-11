import pino from 'pino';
import cron from 'node-cron';
import { AppError } from '../middlewares/errors/AppError';
import { Op } from 'sequelize';
import { Logs } from '../models';
import { env } from './env'

let tableChecked = false;
let databaseLoggingEnabled = false;
let tableCheckPromise: Promise<void> | undefined;
const daysToRetainLogs = env.LOGS_DAYS;

// Configuración de Pino según el entorno
const logger = pino({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'yyyy-mm-dd HH:MM:ss.SSS',
        },
    },
});

// Configuración e implementación de debug, info, warn y error
const dbLogger = {
    debug: (message: string, meta?: object) => {
        if (env.NODE_ENV === 'development') {
            (logger.debug as any)(message, meta);
            saveLogToDatabase('debug', message, meta);
        }
    },
    info: (message: string, meta?: object) => {
        (logger.info as any)(message, meta);
        saveLogToDatabase('info', message, meta);
    },
    warn: (message: string, meta?: object) => {
        (logger.warn as any)(message, meta);
        saveLogToDatabase('warn', message, meta);
    },
    error: (message: string, meta?: object) => {
        (logger.error as any)(message, meta);
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

// Verificar si la tabla logs existe
const checkTableExists = async () => {
    if (tableChecked) return;

    if (tableCheckPromise) {
        return tableCheckPromise;
    }

    tableCheckPromise = (async () => {
        try {
            // Intenta crear la tabla si no existe una vez que PostgreSQL está disponible.
            await Logs.sync();
            tableChecked = true;
            logger.info('Logs table verified or created');
        } catch (error) {
            (logger.error as any)('Error checking logs table:', error);
        } finally {
            tableCheckPromise = undefined;
        }
    })();

    return tableCheckPromise;
};

export async function enableDatabaseLogging() {
    databaseLoggingEnabled = true;
    await checkTableExists();
}

const saveLogToDatabase = async (level: string, message: string, meta?: object) => {
    if (!databaseLoggingEnabled) {
        return;
    }

    try {
        // Verifica si la tabla existe antes de intentar guardar
        if (!tableChecked) {
            await checkTableExists();
        }

        // Si la tabla ha sido verificada, guarda el log
        if (tableChecked) {
            await Logs.create({ level, message, meta });
        }
    } catch (error: any) { // Usa any para este caso específico
        originalError({ error }, 'Error saving log to database');
        // Si hay un error con la tabla, desactiva temporalmente el guardado
        if (
            error &&
            error.name === 'SequelizeDatabaseError' &&
            error.parent &&
            error.parent.code === '42P01'
        ) {
            tableChecked = false;
        }
    }
};

// Solo programa el cron si no estamos en entorno de test
if (env.NODE_ENV !== 'test') {
    cron.schedule('0 0 * * *', async () => {
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - daysToRetainLogs);

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
    dbLogger.info(`Cron job scheduled for log cleanup (retention: ${daysToRetainLogs} days).`);
} else {
    dbLogger.info('Cron job not scheduled in test environment.');
}

export default dbLogger;
