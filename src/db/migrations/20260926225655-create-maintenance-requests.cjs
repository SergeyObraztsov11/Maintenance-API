"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("maintenance_requests", {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.literal("gen_random_uuid()"),
            },
            equipment_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: "equipment", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT",
            },
            title: { type: Sequelize.STRING(200), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: false },
            priority: {
                type: Sequelize.ENUM("low", "medium", "high", "critical"),
                allowNull: false,
                defaultValue: "medium",
            },
            status: {
                type: Sequelize.ENUM("new", "in_progress", "done"),
                allowNull: false,
                defaultValue: "new",
            },
            planned_at: { type: Sequelize.DATE, allowNull: false },
            author: { type: Sequelize.STRING(200), allowNull: false },
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
        await queryInterface.dropTable("maintenance_requests");
        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_maintenance_requests_priority";',
        );
        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_maintenance_requests_status";',
        );
    },
};
