import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";

export const MaintenanceRequest = sequelize.define(
    "MaintenanceRequest",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        equipmentId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "equipment_id",
        },
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        priority: {
            type: DataTypes.ENUM("low", "medium", "high", "critical"),
            allowNull: false,
            defaultValue: "medium",
        },
        status: {
            type: DataTypes.ENUM("new", "in_progress", "done"),
            allowNull: false,
            defaultValue: "new",
        },
        plannedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            field: "planned_at",
        },
        author: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
    },
    {
        tableName: "maintenance_requests",
        underscored: true,
        timestamps: true,
    },
);
