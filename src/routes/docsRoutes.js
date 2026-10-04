import { Router } from "express";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const openApiPath = join(__dirname, "../docs/openapi.yaml");
const openApiDocument = YAML.parse(readFileSync(openApiPath, "utf8"));

const router = Router();

router.get("/openapi.json", (req, res) => {
    res.json(openApiDocument);
});

router.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
        customSiteTitle: "Maintenance API Docs",
    }),
);

export default router;
