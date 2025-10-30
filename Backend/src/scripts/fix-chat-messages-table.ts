import { sequelize } from '../config/database';
import dbLogger from '../config/logger';

/**
 * Script para verificar y corregir la tabla chat_messages
 * Este script agrega la columna 'id' si no existe
 */

async function fixChatMessagesTable() {
    try {
        dbLogger.info('[FIX] Verificando estructura de la tabla chat_messages...');

        // Verificar si la columna 'id' existe
        const [results] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'chat_messages' AND column_name = 'id';
        `);

        if (results.length === 0) {
            dbLogger.warn('[FIX] La columna "id" no existe. Agregándola...');
            
            // Agregar la columna id como primary key
            await sequelize.query(`
                ALTER TABLE chat_messages 
                ADD COLUMN id UUID DEFAULT gen_random_uuid();
            `);

            // Poblar los IDs existentes (si hay datos)
            await sequelize.query(`
                UPDATE chat_messages 
                SET id = gen_random_uuid() 
                WHERE id IS NULL;
            `);

            // Hacer que la columna sea NOT NULL
            await sequelize.query(`
                ALTER TABLE chat_messages 
                ALTER COLUMN id SET NOT NULL;
            `);

            // Establecer como primary key
            await sequelize.query(`
                ALTER TABLE chat_messages 
                ADD PRIMARY KEY (id);
            `);

            dbLogger.info('[FIX] ✓ Columna "id" agregada exitosamente como primary key');
        } else {
            dbLogger.info('[FIX] ✓ La columna "id" ya existe');
        }

        // Verificar todas las columnas actuales
        const [columns] = await sequelize.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'chat_messages'
            ORDER BY ordinal_position;
        `);

        dbLogger.info('[FIX] Estructura actual de la tabla:');
        console.table(columns);

        dbLogger.info('[FIX] ✓ Verificación completada');
        
    } catch (error) {
        dbLogger.error('[FIX] Error al verificar/corregir la tabla:', { error });
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Ejecutar el script
fixChatMessagesTable()
    .then(() => {
        console.log('\n✓ Script completado exitosamente');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n✗ Error ejecutando el script:', error);
        process.exit(1);
    });
