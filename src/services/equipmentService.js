// Бизнес-логика оборудования: правила, id, конфликты серийников.

import { randomUUID } from "node:crypto";
import { equipmentRepository } from "../repositories/equipmentRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { requestRepository } from "../repositories/requestRepository.js";

export const equipmentService = {
    async list(query = {}) {
        let items = await equipmentRepository.findAll();

        if (query.status) {
            items = items.filter((item) => item.status === query.status);
        }
        if (query.type) {
            items = items.filter((item) => item.type === query.type);
        }

        const sortBy = query.sortBy || "createdAt";
        const sortOrder = query.sortOrder === "asc" ? 1 : -1;
        const allowedSort = [
            "name",
            "type",
            "status",
            "installedAt",
            "createdAt",
            "updatedAt",
        ];
        const field = allowedSort.includes(sortBy) ? sortBy : "createdAt";

        items = [...items].sort((a, b) => {
            if (a[field] === b[field]) return 0;
            return a[field] > b[field] ? sortOrder : -sortOrder;
        });

        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
        const total = items.length;
        const start = (page - 1) * limit;
        const data = items.slice(start, start + limit);

        return {
            data,
            meta: { total, page, limit },
        };
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
        const requests = await requestRepository.findByEquipmentId(id);
        const hasOpen = requests.some(
            (item) => item.status === "new" || item.status === "in_progress",
        );
        if (hasOpen) {
            throw new ConflictError(
                `Cannot delete equipment ${id}: open maintenance requests exist`,
            );
        }
        await equipmentRepository.remove(id);
    },
};
