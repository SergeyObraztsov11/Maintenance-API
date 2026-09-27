import { Equipment, EquipmentPassport, Site } from "../models/index.js";
import { Op } from "sequelize";

function toNumber(value) {
    return value === null || value === undefined ? value : Number(value);
}

function buildListQuery(query = {}) {
    const where = {};

    if (query.status) {
        where.status = query.status;
    }
    if (query.type) {
        where.type = query.type;
    }
    if (query.installedAtFrom || query.installedAtTo) {
        where.installedAt = {};
        if (query.installedAtFrom) {
            where.installedAt[Op.gte] = query.installedAtFrom;
        }
        if (query.installedAtTo) {
            where.installedAt[Op.lte] = query.installedAtTo;
        }
    }
    if (query.createdAtFrom || query.createdAtTo) {
        where.createdAt = {};
        if (query.createdAtFrom) {
            where.createdAt[Op.gte] = query.createdAtFrom;
        }
        if (query.createdAtTo) {
            where.createdAt[Op.lte] = query.createdAtTo;
        }
    }
    const allowedSort = [
        "name",
        "type",
        "status",
        "installedAt",
        "createdAt",
        "updatedAt",
    ];
    const sortBy = allowedSort.includes(query.sortBy)
        ? query.sortBy
        : "createdAt";
    const sortOrder = query.sortOrder === "asc" ? "ASC" : "DESC";
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const offset = (page - 1) * limit;
    return {
        where,
        order: [[sortBy, sortOrder]],
        limit,
        offset,
        page,
    };
}

function toApi(equipment) {
    const plain = equipment.get({ plain: true });
    const site = plain.site;

    return {
        id: plain.id,
        name: plain.name,
        type: plain.type,
        serialNumber: plain.serialNumber,
        status: plain.status,
        installedAt: plain.installedAt,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
        location: site
            ? { lat: toNumber(site.lat), lon: toNumber(site.lon) }
            : null,
        siteId: plain.siteId,
        passport: plain.passport
            ? {
                  id: plain.passport.id,
                  manufacturer: plain.passport.manufacturer,
                  model: plain.passport.model,
                  ratedPowerKw: toNumber(plain.passport.ratedPowerKw),
                  lastInspectionAt: plain.passport.lastInspectionAt,
              }
            : null,
    };
}

export const equipmentRepository = {
    async findAll(query = {}) {
        const { where, order, limit, offset, page } = buildListQuery(query);

        const { rows, count } = await Equipment.findAndCountAll({
            where,
            order,
            limit,
            offset,
            distinct: true,
            include: [
                {
                    model: Site,
                    as: "site",
                    attributes: ["id", "lat", "lon", "name", "code"],
                },
                {
                    model: EquipmentPassport,
                    as: "passport",
                    attributes: [
                        "id",
                        "manufacturer",
                        "model",
                        "ratedPowerKw",
                        "lastInspectionAt",
                    ],
                    required: false,
                },
            ],
        });
        return {
            data: rows.map(toApi),
            meta: { total: count, page, limit },
        };
    },
    async findById(id) {
        const row = await Equipment.findByPk(id, {
            include: [
                {
                    model: Site,
                    as: "site",
                    attributes: ["id", "lat", "lon", "name", "code"],
                },
                {
                    model: EquipmentPassport,
                    as: "passport",
                    attributes: [
                        "id",
                        "manufacturer",
                        "model",
                        "ratedPowerKw",
                        "lastInspectionAt",
                    ],
                    required: false,
                },
            ],
        });
        return row ? toApi(row) : null;
    },
    async findBySerialNumber(serialNumber) {
        const row = await Equipment.findOne({
            where: { serialNumber },
            include: [
                {
                    model: Site,
                    as: "site",
                    attributes: ["id", "lat", "lon", "name", "code"],
                },
                {
                    model: EquipmentPassport,
                    as: "passport",
                    attributes: [
                        "id",
                        "manufacturer",
                        "model",
                        "ratedPowerKw",
                        "lastInspectionAt",
                    ],
                    required: false,
                },
            ],
        });
        return row ? toApi(row) : null;
    },
    async create(equipment) {
        let site = await Site.findOne({
            where: {
                lat: equipment.location.lat,
                lon: equipment.location.lon,
            },
        });
        if (!site) {
            site = await Site.create({
                name: `Site ${equipment.location.lat}, ${equipment.location.lon}`,
                code: `AUTO-${Date.now()}`,
                region: "unknown",
                lat: equipment.location.lat,
                lon: equipment.location.lon,
            });
        }
        await Equipment.create({
            id: equipment.id,
            siteId: site.id,
            name: equipment.name,
            type: equipment.type,
            serialNumber: equipment.serialNumber,
            status: equipment.status,
            installedAt: equipment.installedAt,
            createdAt: equipment.createdAt,
            updatedAt: equipment.updatedAt,
        });
        return this.findById(equipment.id);
    },
    async update(id, patch) {
        const row = await Equipment.findByPk(id, {
            include: [{ model: Site, as: "site" }],
        });
        if (!row) return null;

        if (patch.location) {
            await row.site.update({
                lat: patch.location.lat,
                lon: patch.location.lon,
            });
        }

        const data = { ...patch };
        delete data.location;
        delete data.id;
        delete data.createdAt;
        delete data.passport;
        delete data.siteId;

        await row.update(data);
        return this.findById(id);
    },
    async remove(id) {
        const deleted = await Equipment.destroy({ where: { id } });
        return deleted > 0;
    },
};
