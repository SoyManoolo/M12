import { sequelize } from "../config/database";
import { Model, DataTypes } from "sequelize";

export class RefreshToken extends Model {
    declare token: string;
    declare user_id: string;
    declare created_at: Date;
    declare expires_at: Date;
}

RefreshToken.init({
    token: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
        unique: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,

    },
    created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    expires_at: {
        type: DataTypes.DATE,
        allowNull: false
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
)
