import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";

export const EquipmentPassport = sequelize.define(
    "EquipmentPassport",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        equipmentId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            field: "equipment_id",
        },
        manufacturer: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        model: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        ratedPowerKw: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false,
            field: "rated_power_kw",
        },
        lastInspectionAt: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            field: "last_inspection_at",
        },
    },
    {
        tableName: "equipment_passports",
        underscored: true,
        timestamps: true,
    },
);
