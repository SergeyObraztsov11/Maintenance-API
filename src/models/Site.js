import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";

export const Site = sequelize.define(
    "Site",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        region: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        lat: {
            type: DataTypes.DECIMAL(9, 6),
            allowNull: false,
        },
        lon: {
            type: DataTypes.DECIMAL(9, 6),
            allowNull: false,
        },
    },
    {
        tableName: "sites",
        underscored: true,
        timestamps: true,
    },
);
