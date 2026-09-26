"use strict";

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("sites", {
            id: {
                type: Sequelize.UUID,
                primaryKey: true,
                allowNull: false,
                defaultValue: Sequelize.literal("gen_random_uuid()"),
            },
            name: {
                type: Sequelize.STRING(200),
                allowNull: false,
            },
            code: {
                type: Sequelize.STRING(50),
                allowNull: false,
                unique: true,
            },
            region: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            lat: {
                type: Sequelize.DECIMAL(9, 6),
                allowNull: false,
            },
            lon: {
                type: Sequelize.DECIMAL(9, 6),
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
        await queryInterface.dropTable("sites");
    },
};
