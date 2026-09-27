import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";

export const RequestStatusHistory = sequelize.define(
    "RequestStatusHistory",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        requestId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "request_id",
        },
        fromStatus: {
            type: DataTypes.ENUM("new", "in_progress", "done", "rejected"),
            allowNull: true,
            field: "from_status",
        },
        toStatus: {
            type: DataTypes.ENUM("new", "in_progress", "done", "rejected"),
            allowNull: false,
            field: "to_status",
        },
        changedBy: {
            type: DataTypes.STRING(200),
            allowNull: false,
            field: "changed_by",
        },
        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        tableName: "request_status_history",
        underscored: true,
        timestamps: true,
        updatedAt: false,
    },
);
