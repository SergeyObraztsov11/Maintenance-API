import { sequelize } from "../../src/db/index.js";

const TRUNCATE_SQL = `
TRUNCATE TABLE
  users,
  request_assignees,
  request_status_history,
  maintenance_requests,
  equipment_passports,
  equipment,
  technicians,
  sites
RESTART IDENTITY CASCADE
`;

export async function connectTestDb() {
    await sequelize.authenticate();
}

export async function resetDb() {
    await sequelize.query(TRUNCATE_SQL);
}

export async function closeTestDb() {
    await sequelize.close();
}
