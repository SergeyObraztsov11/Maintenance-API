import { Sequelize } from "sequelize";
import { config } from "../config/index.js";

export const sequelize = new Sequelize(
    config.db.name,
    config.db.user,
    config.db.password,
    {
        host: config.db.host,
        port: config.db.port,
        dialect: "postgres",
        logging: config.nodeEnv === "development" ? console.log : false,
        pool: {
            max: config.db.poolMax,
            min: config.db.poolMin,
        },
    },
);

export async function connectDB() {
    await sequelize.authenticate();
}

export async function closeDB() {
    await sequelize.close();
}
