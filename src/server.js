import "dotenv/config";
import app from "./app.js";
import { config } from "./config/index.js";
import { connectDB, closeDB } from "./db/index.js";

async function startServer() {
    try {
        await connectDB();
        console.log("Database connected");
    } catch (error) {
        console.error("Failed to connect to database:", error);
        process.exit(1);
    }

    const server = app.listen(config.port, () => {
        console.log(`Server listening on port ${config.port}`);
    });

    const shutdown = async (signal) => {
        console.log(`Received ${signal}. Shutting down...`);

        server.close(async () => {
            await closeDB();
            console.log("Server closed");
            process.exit(0);
        });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer();
