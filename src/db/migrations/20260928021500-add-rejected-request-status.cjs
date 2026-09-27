"use strict";

async function addEnumValue(queryInterface, typeName, value) {
    await queryInterface.sequelize.query(
        `ALTER TYPE "${typeName}" ADD VALUE IF NOT EXISTS '${value}';`,
    );
}

async function shrinkEnum(
    queryInterface,
    { table, column, typeName, values, defaultValue = null },
) {
    const valuesSql = values.map((v) => `'${v}'`).join(", ");

    if (defaultValue !== null) {
        await queryInterface.sequelize.query(
            `ALTER TABLE "${table}" ALTER COLUMN "${column}" DROP DEFAULT;`,
        );
    }

    await queryInterface.sequelize.query(
        `ALTER TABLE "${table}" ALTER COLUMN "${column}" TYPE TEXT USING "${column}"::text;`,
    );
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${typeName}";`);
    await queryInterface.sequelize.query(
        `CREATE TYPE "${typeName}" AS ENUM (${valuesSql});`,
    );
    await queryInterface.sequelize.query(`
        ALTER TABLE "${table}"
        ALTER COLUMN "${column}" TYPE "${typeName}"
        USING "${column}"::"${typeName}";
    `);

    if (defaultValue !== null) {
        await queryInterface.sequelize.query(
            `ALTER TABLE "${table}" ALTER COLUMN "${column}" SET DEFAULT '${defaultValue}';`,
        );
    }
}

module.exports = {
    async up(queryInterface) {
        await addEnumValue(
            queryInterface,
            "enum_maintenance_requests_status",
            "rejected",
        );
        await addEnumValue(
            queryInterface,
            "enum_request_status_history_from_status",
            "rejected",
        );
        await addEnumValue(
            queryInterface,
            "enum_request_status_history_to_status",
            "rejected",
        );
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(`
            UPDATE request_status_history
            SET from_status = 'done'
            WHERE from_status::text = 'rejected';
        `);
        await queryInterface.sequelize.query(`
            UPDATE request_status_history
            SET to_status = 'done'
            WHERE to_status::text = 'rejected';
        `);
        await queryInterface.sequelize.query(`
            UPDATE maintenance_requests
            SET status = 'done'
            WHERE status::text = 'rejected';
        `);

        await shrinkEnum(queryInterface, {
            table: "maintenance_requests",
            column: "status",
            typeName: "enum_maintenance_requests_status",
            values: ["new", "in_progress", "done"],
            defaultValue: "new",
        });
        await shrinkEnum(queryInterface, {
            table: "request_status_history",
            column: "from_status",
            typeName: "enum_request_status_history_from_status",
            values: ["new", "in_progress", "done"],
        });
        await shrinkEnum(queryInterface, {
            table: "request_status_history",
            column: "to_status",
            typeName: "enum_request_status_history_to_status",
            values: ["new", "in_progress", "done"],
        });
    },
};
