import { randomUUID } from "node:crypto";
import { equipmentRepository } from "../repositories/equipmentRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

export const equipmentService = {
  async list() {
    return equipmentRepository.findAll();
  },

  async getById(id) {
    const equipment = await equipmentRepository.findById(id);
    if (!equipment) {
      throw new NotFoundError(`Equipment ${id} not found`);
    }
    return equipment;
  },

  async create(input) {
    const existing = await equipmentRepository.findBySerialNumber(
      input.serialNumber,
    );
    if (existing) {
      throw new ConflictError(
        `Serial number ${input.serialNumber} already exists`,
      );
    }

    const now = new Date().toISOString();
    
    const equipment = {
      id: randomUUID(),
      name: input.name,
      type: input.type,
      serialNumber: input.serialNumber,
      location: input.location,
      status: input.status,
      installedAt: input.installedAt,
      createdAt: now,
      updatedAt: now,
    };

    return equipmentRepository.create(equipment);
  },

  async update(id, input) {
    await this.getById(id);

    if (input.serialNumber) {
      const existing = await equipmentRepository.findBySerialNumber(
        input.serialNumber,
      );
      if (existing && existing.id !== id) {
        throw new ConflictError(
          `Serial number ${input.serialNumber} already exists`,
        );
      }
    }

    const patch = { ...input, updatedAt: new Date().toISOString() };
    delete patch.id;
    delete patch.createdAt;

    return equipmentRepository.update(id, patch);
  },

  async remove(id) {
    await this.getById(id);
    await equipmentRepository.remove(id);
  },
};