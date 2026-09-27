import { Equipment, EquipmentPassport, Site } from "../models/index.js";

function toNumber(value) {
    return value === null || value === undefined ? value : Number(value);
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
    async findAll() {
        const rows = await Equipment.findAll({
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
            order: [["createdAt", "DESC"]],
        });
        return rows.map(toApi);
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
