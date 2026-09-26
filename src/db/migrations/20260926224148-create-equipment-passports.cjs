"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("equipment_passports", {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.literal("gen_random_uuid()"),
            },
            equipment_id: {
                type: Sequelize.UUID,
                allowNull: false,
                unique: true,
                references: { model: "equipment", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            manufacturer: { type: Sequelize.STRING(200), allowNull: false },
            model: { type: Sequelize.STRING(200), allowNull: false },
            rated_power_kw: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
            },
            last_inspection_at: {
                type: Sequelize.DATEONLY,
                allowNull: true,
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("equipment_passports");
    },
};
