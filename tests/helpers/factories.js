import { randomUUID } from "node:crypto";
import {
    Site,
    Equipment,
    Technician,
    MaintenanceRequest,
    RequestAssignee,
    User,
} from "../../src/models/index.js";
import { bcryptHashPassword } from "../../src/utils/bcryptPassword.js";

export async function createUser({
    email = `user-${randomUUID()}@example.com`,
    password = "password123",
    role = "viewer",
    technicianId = null,
} = {}) {
    const passwordHash = await bcryptHashPassword(password);
    const user = await User.create({
        email,
        passwordHash,
        role,
        technicianId,
    });
    return { user, password, email };
}

export async function createTechnician({
    fullName = "Tech Test",
    specialization = "electrical",
    employeeNumber = `EMP-${randomUUID().slice(0, 8)}`,
} = {}) {
    return Technician.create({
        id: randomUUID(),
        fullName,
        specialization,
        employeeNumber,
    });
}

export async function createEquipment({
    name = "Test Turbine",
    serialNumber = `SN-${randomUUID().slice(0, 8)}`,
} = {}) {
    const site = await Site.create({
        id: randomUUID(),
        name: "Test Site",
        code: `SITE-${randomUUID().slice(0, 8)}`,
        region: "Test",
        lat: 55.75,
        lon: 37.61,
    });

    return Equipment.create({
        id: randomUUID(),
        siteId: site.id,
        name,
        type: "turbine",
        serialNumber,
        status: "operational",
        installedAt: "2024-01-01",
    });
}

export async function createRequest({
    equipmentId,
    title = "Test request",
    status = "new",
    priority = "medium",
} = {}) {
    const equipment =
        equipmentId != null ? { id: equipmentId } : await createEquipment();

    return MaintenanceRequest.create({
        id: randomUUID(),
        equipmentId: equipment.id,
        title,
        description: "desc",
        priority,
        status,
        plannedAt: new Date("2026-10-10T10:00:00.000Z"),
        author: "tests",
    });
}

export async function assignTechnician(requestId, technicianId, role = "lead") {
    return RequestAssignee.create({
        requestId,
        technicianId,
        role,
        hours: 0,
    });
}
