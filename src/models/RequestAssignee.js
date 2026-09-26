import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";

export const RequestAssignee = sequelize.define(
    "RequestAssignee",
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
        technicianId: {
            type: DataTypes.UUID,
            allowNull: false,
            field: "technician_id",
        },
        role: {
            type: DataTypes.ENUM("lead", "member"),
            allowNull: false,
        },
        hours: {
            type: DataTypes.DECIMAL(6, 2),
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        tableName: "request_assignees",
        underscored: true,
        timestamps: true,
    },
);
