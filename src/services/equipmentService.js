// Бизнес-логика оборудования: правила, id, конфликты серийников.

import { randomUUID } from "node:crypto";
import { equipmentRepository } from "../repositories/equipmentRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { requestRepository } from "../repositories/requestRepository.js";

export const equipmentService = {
    async list(query = {}) {
        return equipmentRepository.findAll(query);
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

        try {
            return await equipmentRepository.create(equipment);
        } catch (err) {
            if (err.name === "SequelizeUniqueConstraintError") {
                throw new ConflictError(
                    `Serial number ${input.serialNumber} already exists`,
                );
            }
            throw err;
        }
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

        try {
            return await equipmentRepository.update(id, patch);
        } catch (err) {
            if (err.name === "SequelizeUniqueConstraintError") {
                throw new ConflictError(
                    `Serial number ${input.serialNumber} already exists`,
                );
            }
            throw err;
        }
    },
    async remove(id) {
        await this.getById(id);
        const requests = await requestRepository.findByEquipmentId(id);
        if (requests.length > 0) {
            const hasOpen = requests.some(
                (item) => item.status === "new" || item.status === "in_progress",
            );
            throw new ConflictError(
                hasOpen
                    ? `Cannot delete equipment ${id}: open maintenance requests exist`
                    : `Cannot delete equipment ${id}: related maintenance requests exist`,
            );
        }
        try {
            await equipmentRepository.remove(id);
        } catch (err) {
            if (err.name === "SequelizeForeignKeyConstraintError") {
                throw new ConflictError(
                    `Cannot delete equipment ${id}: related records exist`,
                );
            }
            if (err.name === "SequelizeUniqueConstraintError") {
                throw new ConflictError(
                    `Cannot delete equipment ${id}: unique constraint violated`,
                );
            }
            throw err;
        }
    },
};
