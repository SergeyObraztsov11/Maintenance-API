import { DataTypes } from "sequelize";
import { sequelize } from "../db/index.js";

export const Technician = sequelize.define(
    "Technician",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        fullName: {
            type: DataTypes.STRING(200),
            allowNull: false,
            field: "full_name",
        },
        specialization: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        employeeNumber: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
            field: "employee_number",
        },
    },
    {
        tableName: "technicians",
        underscored: true,
        timestamps: true,
    },
);
