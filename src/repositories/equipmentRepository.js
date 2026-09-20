import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { config } from "../config/index.js";

const filePath = path.join(config.dataDir, "equipment.json");

async function ensureFile() {
  await mkdir(config.dataDir, { recursive: true });
  try {
    await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(filePath, "[]", "utf8");
    } else {
      throw error;
    }
  }
}

async function readAll() {
  await ensureFile();
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeAll(items) {
  await ensureFile();
  await writeFile(filePath, JSON.stringify(items, null, 2), "utf8");
}

export const equipmentRepository = {
  async findAll() {
    return readAll();
  },

  async findById(id) {
    const items = await readAll();
    return items.find((item) => item.id === id) ?? null;
  },

  async findBySerialNumber(serialNumber) {
    const items = await readAll();
    return items.find((item) => item.serialNumber === serialNumber) ?? null;
  },

  async create(equipment) {
    const items = await readAll();
    items.push(equipment);
    await writeAll(items);
    return equipment;
  },

  async update(id, patch) {
    const items = await readAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...patch };
    await writeAll(items);
    return items[index];
  },

  async remove(id) {
    const items = await readAll();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return false;
    items.splice(index, 1);
    await writeAll(items);
    return true;
  },
};