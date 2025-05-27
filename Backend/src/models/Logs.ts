import { sequelize } from '../config/database'
import { Model, DataTypes } from 'sequelize'

// Clase Logs

export class Logs extends Model { };

Logs.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
        },
        sequence: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true
        },
        level: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        meta: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        timestamp: {
            type: DataTypes.DATE(3),
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: "logs",
        timestamps: false,
    }
);

export default Logs;