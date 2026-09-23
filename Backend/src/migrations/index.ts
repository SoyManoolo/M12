import { DataTypes, QueryInterface, QueryTypes, Sequelize, SyncOptions, Transaction } from 'sequelize';

interface Migration {
    name: string;
    up(queryInterface: QueryInterface, sequelize: Sequelize, transaction: Transaction): Promise<void>;
}

const migrations: Migration[] = [
    {
        name: '20260923000000-initial-model-schema',
        async up(_queryInterface, sequelize, transaction) {
            // Empty databases receive the current model baseline. Existing databases
            // are adopted as-is; schema changes after this point must be new migrations.
            try {
                await sequelize.getQueryInterface().describeTable('users');
            } catch {
                await sequelize.sync({ transaction } as SyncOptions);
            }
        }
    },
    {
        name: '20260923000100-friendship-query-indexes',
        async up(queryInterface, _sequelize, transaction) {
            const indexes = await queryInterface.showIndex('friend_requests', { transaction }) as Array<{ name: string }>;
            const names = new Set(indexes.map(index => index.name));
            if (!names.has('idx_friend_requests_pair_status')) {
                await queryInterface.addIndex('friend_requests', ['sender_id', 'receiver_id', 'status'], {
                    name: 'idx_friend_requests_pair_status', transaction
                });
            }
        }
    },
    {
        name: '20260923000200-password-reset-tokens',
        async up(queryInterface, _sequelize, transaction) {
            const tables = await queryInterface.showAllTables({ transaction }) as string[];
            if (!tables.includes('password_reset_tokens')) {
                await queryInterface.createTable('password_reset_tokens', {
                    reset_id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
                    user_id: {
                        type: DataTypes.UUID,
                        allowNull: false,
                        references: { model: 'users', key: 'user_id' },
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE'
                    },
                    token_hash: { type: DataTypes.STRING(64), allowNull: false },
                    expires_at: { type: DataTypes.DATE, allowNull: false },
                    used_at: { type: DataTypes.DATE, allowNull: true },
                    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
                }, { transaction });
            }
            const indexes = await queryInterface.showIndex('password_reset_tokens', { transaction }) as Array<{ name: string }>;
            const names = new Set(indexes.map(index => index.name));
            if (!names.has('idx_password_reset_token_hash')) {
                await queryInterface.addIndex('password_reset_tokens', ['token_hash'], {
                    name: 'idx_password_reset_token_hash', unique: true, transaction
                });
            }
            if (!names.has('idx_password_reset_user_expiry')) {
                await queryInterface.addIndex('password_reset_tokens', ['user_id', 'expires_at'], {
                    name: 'idx_password_reset_user_expiry', transaction
                });
            }
        }
    },
    {
        name: '20260923000300-session-refresh-tokens',
        async up(queryInterface, _sequelize, transaction) {
            const tables = await queryInterface.showAllTables({ transaction }) as string[];
            if (!tables.includes('session_refresh_tokens')) {
                await queryInterface.createTable('session_refresh_tokens', {
                    session_id: { type: DataTypes.UUID, allowNull: false, primaryKey: true },
                    user_id: {
                        type: DataTypes.UUID,
                        allowNull: false,
                        references: { model: 'users', key: 'user_id' },
                        onUpdate: 'CASCADE',
                        onDelete: 'CASCADE'
                    },
                    token_hash: { type: DataTypes.STRING(64), allowNull: false, unique: true },
                    expires_at: { type: DataTypes.DATE, allowNull: false },
                    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
                }, { transaction });
            }
            const indexes = await queryInterface.showIndex('session_refresh_tokens', { transaction }) as Array<{ name: string }>;
            const names = new Set(indexes.map(index => index.name));
            if (!names.has('idx_session_refresh_token_hash')) {
                await queryInterface.addIndex('session_refresh_tokens', ['token_hash'], {
                    name: 'idx_session_refresh_token_hash', unique: true, transaction
                });
            }
            if (!names.has('idx_session_refresh_user_expiry')) {
                await queryInterface.addIndex('session_refresh_tokens', ['user_id', 'expires_at'], {
                    name: 'idx_session_refresh_user_expiry', transaction
                });
            }
        }
    }
];

export async function runMigrations(sequelize: Sequelize): Promise<void> {
    // Load model definitions only after database.ts has constructed the Sequelize instance.
    await import('../models/index.js');
    const queryInterface = sequelize.getQueryInterface();
    const lockKey = 'friendsgo:sequelize-migrations';
    await sequelize.transaction(async transaction => {
        await sequelize.query('SELECT pg_advisory_xact_lock(hashtext(:lockKey))', {
            replacements: { lockKey }, transaction
        });
        const tableName = 'SequelizeMeta';
        const tables = await queryInterface.showAllTables({ transaction }) as string[];
        if (!tables.includes(tableName)) {
            await queryInterface.createTable(tableName, {
                name: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true }
            }, { transaction });
        }

        const appliedRows = await sequelize.query<{ name: string }>(
            `SELECT name FROM "${tableName}"`,
            { type: QueryTypes.SELECT, transaction }
        );
        const applied = new Set(appliedRows.map(row => row.name));

        for (const migration of migrations) {
            if (applied.has(migration.name)) continue;
            await migration.up(queryInterface, sequelize, transaction);
            await sequelize.query(`INSERT INTO "${tableName}" (name) VALUES (:name)`, {
                replacements: { name: migration.name },
                type: QueryTypes.INSERT,
                transaction
            });
        }
    });
}
