import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";

export const Equipment = sequelize.define(
    "Equipment",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        siteId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "site_id",
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        serialNumber: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            field: "serial_number",
        },
        status: {
            type: DataTypes.ENUM(
                "operational",
                "maintenance",
                "fault",
                "decommissioned",
            ),
            allowNull: false,
            defaultValue: "operational",
        },
        installedAt: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            field: "installed_at",
        },
    },
    {
        tableName: "equipment",
        underscored: true,
        timestamps: true,
    },
);
