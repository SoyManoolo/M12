import pino from 'pino';
import cron from 'node-cron';
import { AppError } from '../middlewares/errors/AppError';
import { Op } from 'sequelize';
import { Logs } from '../models';

let tableChecked = false;
const daysToRetainLogs = parseInt(process.env.LOGS_DAYS as string, 10) || 7;

const logger = pino({
    level: 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'yyyy-mm-dd HH:MM:ss.SSS',
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

// Verificar si la tabla logs existe
const checkTableExists = async () => {
    if (tableChecked) return;

    try {
        // Intenta crear la tabla si no existe
        await Logs.sync();
        tableChecked = true;
        logger.info('Logs table verified or created');
    } catch (error) {
        logger.error('Error checking logs table:', error);
    }
};

const saveLogToDatabase = async (level: string, message: string, meta?: object) => {
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
        console.error('Error saving log to database:', error);
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
if (process.env.NODE_ENV !== 'test') {
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