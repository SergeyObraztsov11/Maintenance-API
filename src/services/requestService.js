import { randomUUID } from "node:crypto";
import { requestRepository } from "../repositories/requestRepository.js";
import { equipmentRepository } from "../repositories/equipmentRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { Technician } from "../models/index.js";

// Бизнес-логика заявок: правила, статусы, привязка к оборудованию.
const ALLOWED_TRANSITIONS = {
    new: ["in_progress", "rejected"],
    in_progress: ["done", "rejected"],
    done: [],
    rejected: [],
};

export const requestService = {
    async list(query = {}) {
        return requestRepository.findAll(query);
    },

    async listByEquipmentId(equipmentId, query = {}) {
        const equipment = await equipmentRepository.findById(equipmentId);
        if (!equipment) {
            throw new NotFoundError(`Equipment ${equipmentId} not found`);
        }
        return this.list({ ...query, equipmentId });
    },

    async getById(id) {
        const request = await requestRepository.findById(id);
        if (!request) {
            throw new NotFoundError(`Request ${id} not found`);
        }
        return request;
    },

    async create(input) {
        const equipment = await equipmentRepository.findById(input.equipmentId);
        if (!equipment) {
            throw new NotFoundError(`Equipment ${input.equipmentId} not found`);
        }

        const now = new Date().toISOString();
        const request = {
            id: randomUUID(),
            equipmentId: input.equipmentId,
            title: input.title,
            description: input.description ?? "",
            priority: input.priority,
            status: "new",
            plannedAt: input.plannedAt ?? null,
            createdAt: now,
            updatedAt: now,
        };

        return requestRepository.create(request);
    },

    async update(id, input) {
        await this.getById(id);

        const patch = { ...input, updatedAt: new Date().toISOString() };
        delete patch.id;
        delete patch.createdAt;
        delete patch.status;

        return requestRepository.update(id, patch);
    },
    async changeStatus(id, status) {
        const request = await this.getById(id);
        const allowed = ALLOWED_TRANSITIONS[request.status] ?? [];
        if (!allowed.includes(status)) {
            throw new ConflictError(
                `Cannot change status from ${request.status} to ${status}`,
            );
        }

        if (status === "in_progress") {
            const count = await requestRepository.countAssignees(id);
            if (count === 0) {
                throw new ConflictError(
                    "Cannot set in_progress without assignees",
                );
            }
        }
        const updated = await requestRepository.changeStatus(id, {
            status,
            changedBy: "api",
            comment: null,
        });
        return updated;
    },
    async getStatusHistory(id) {
        await this.getById(id);
        return requestRepository.findStatusHistory(id);
    },
    async remove(id) {
        await this.getById(id);
        await requestRepository.remove(id);
    },
    async addAssignee(requestId, { technicianId, role, hours }) {
        await this.getById(requestId);
        const tech = await Technician.findByPk(technicianId);
        if (!tech) {
            throw new NotFoundError(`Technician ${technicianId} not found`);
        }
        if (role === "lead") {
            const existingLead = await requestRepository.findLead(requestId);
            if (existingLead) {
                throw new ConflictError("Request already has a lead");
            }
        }
        try {
            return await requestRepository.addAssignee(requestId, {
                technicianId,
                role,
                hours,
            });
        } catch (err) {
            if (err.name === "SequelizeUniqueConstraintError") {
                throw new ConflictError(
                    "Technician is already assigned to this request",
                );
            }
            throw err;
        }
    },
    async removeAssignee(requestId, technicianId) {
        await this.getById(requestId);
        const removed = await requestRepository.removeAssignee(
            requestId,
            technicianId,
        );
        if (!removed) {
            throw new NotFoundError(
                `Assignee ${technicianId} not found on request ${requestId}`,
            );
        }
    },
};
