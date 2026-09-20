import { randomUUID } from "node:crypto";
import { requestRepository } from "../repositories/requestRepository.js";
import { equipmentRepository } from "../repositories/equipmentRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";

// Бизнес-логика заявок: правила, статусы, привязка к оборудованию.
const ALLOWED_TRANSITIONS = {
  new: ["in_progress", "rejected"],
  in_progress: ["done", "rejected"],
  done: [],
  rejected: [],
};

export const requestService = {
  async list(query = {}) {
    let items = await requestRepository.findAll();

    if (query.status) {
      items = items.filter((item) => item.status === query.status);
    }
    if (query.priority) {
      items = items.filter((item) => item.priority === query.priority);
    }
    if (query.equipmentId) {
      items = items.filter((item) => item.equipmentId === query.equipmentId);
    }

    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;
    const allowedSort = [
      "title",
      "priority",
      "status",
      "plannedAt",
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

    return { data, meta: { total, page, limit } };
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

    return requestRepository.update(id, {
      status,
      updatedAt: new Date().toISOString(),
    });
  },

  async remove(id) {
    await this.getById(id);
    await requestRepository.remove(id);
  },
};