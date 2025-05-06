import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";

// Clase JWT

export class JWT extends Model { }

JWT.init({
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    }
},
    {
        sequelize,
        tableName: "jwt",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
    });