"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("users", {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.literal("gen_random_uuid()"),
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            password_hash: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            role: {
                type: Sequelize.ENUM("viewer", "technician", "admin"),
                allowNull: false,
                defaultValue: "viewer",
            },
            technician_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: "technicians",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "SET NULL",
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
        await queryInterface.dropTable("users");
        await queryInterface.sequelize.query(
            'DROP TYPE IF EXISTS "enum_users_role";',
        );
    },
};
