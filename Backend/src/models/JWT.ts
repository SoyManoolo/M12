import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";

// Clase JWT

export class JWT extends Model {
    public token!: string;
    public created_at!: Date;
}

JWT.init({
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        unique: true
    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
},
    {
        sequelize,
        tableName: "jwt",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['token']
            }
        ]
    }
);