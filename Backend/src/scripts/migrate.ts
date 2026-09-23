import { sequelize } from '../config/database';
import { runMigrations } from '../migrations';
import dbLogger from '../config/logger';

async function main() {
    try {
        await sequelize.authenticate();
        await runMigrations(sequelize);
        dbLogger.info('Database migrations completed.');
    } catch (error) {
        dbLogger.error('Database migration failed.', { error });
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

void main();
