import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";

export const USER_ROLES = ["viewer", "technician", "admin"];

export const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        passwordHash: {
            type: DataTypes.STRING(255),
            allowNull: false,
            field: "password_hash",
        },
        role: {
            type: DataTypes.ENUM(...USER_ROLES),
            allowNull: false,
            defaultValue: "viewer",
        },
        technicianId: {
            type: DataTypes.UUID,
            allowNull: true,
            field: "technician_id",
        },
    },
    {
        tableName: "users",
        underscored: true,
        timestamps: true,
        defaultScope: {
            attributes: { exclude: ["passwordHash"] },
        },
        scopes: {
            withPassword: {
                attributes: { include: ["passwordHash"] },
            },
        },
    },
);
