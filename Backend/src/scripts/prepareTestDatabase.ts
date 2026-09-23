import 'dotenv/config';
import '../models';
import { sequelize } from '../config/database';
import { env } from '../config/env';
import dbLogger from '../config/logger';

async function prepareTestDatabase() {
    if (env.NODE_ENV !== 'test' || !env.DB_NAME_TEST || env.DB_NAME_TEST === env.DB_NAME) {
        throw new Error('Refusing to reset a database unless NODE_ENV=test and DB_NAME_TEST differs from DB_NAME.');
    }

    if (env.DATABASE_URL_TEST) {
        const testDatabaseName = decodeURIComponent(new URL(env.DATABASE_URL_TEST).pathname).replace(/^\//, '');
        if (env.DATABASE_URL_TEST === env.DATABASE_URL || testDatabaseName !== env.DB_NAME_TEST) {
            throw new Error('DATABASE_URL_TEST must point to DB_NAME_TEST and differ from DATABASE_URL.');
        }
    }

    try {
        await sequelize.authenticate();
        await sequelize.sync({ force: true });
        dbLogger.info('Ephemeral test database schema prepared.');
    } finally {
        await sequelize.close();
    }
}

void prepareTestDatabase().catch(error => {
    dbLogger.error('Could not prepare the ephemeral test database.', { error });
    process.exitCode = 1;
});
