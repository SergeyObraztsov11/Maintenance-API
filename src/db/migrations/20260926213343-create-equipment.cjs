"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("equipment", {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.literal("gen_random_uuid()"),
            },
            site_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: "sites", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT",
            },
            name: { type: Sequelize.STRING(200), allowNull: false },
            type: { type: Sequelize.STRING(100), allowNull: false },
            serial_number: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
            },
            status: {
                type: Sequelize.ENUM(
                    "operational",
                    "maintenance",
                    "fault",
                    "decommissioned",
                ),
                allowNull: false,
                defaultValue: "operational",
            },
            installed_at: {
                type: Sequelize.DATEONLY,
                allowNull: false,
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
        await queryInterface.dropTable("equipment");
        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_equipment_status";',
        );
    },
};
