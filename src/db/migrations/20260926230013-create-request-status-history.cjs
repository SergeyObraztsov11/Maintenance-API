"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("request_status_history", {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.literal("gen_random_uuid()"),
            },
            request_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: "maintenance_requests", key: "id" },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            from_status: {
                type: Sequelize.ENUM("new", "in_progress", "done"),
                allowNull: true,
            },
            to_status: {
                type: Sequelize.ENUM("new", "in_progress", "done"),
                allowNull: false,
            },
            changed_by: { type: Sequelize.STRING(200), allowNull: false },
            comment: { type: Sequelize.TEXT, allowNull: true },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable("request_status_history");
        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_request_status_history_from_status";',
        );
        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_request_status_history_to_status";',
        );
    },
};
