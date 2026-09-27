import "dotenv/config";
import { connectDB, closeDB, sequelize } from "../db/index.js";
import {
    Site,
    Equipment,
    EquipmentPassport,
    Technician,
    MaintenanceRequest,
    RequestStatusHistory,
    RequestAssignee,
} from "../models/index.js";

async function clearDb() {
    await sequelize.query(`
        TRUNCATE TABLE
            request_assignees,
            request_status_history,
            maintenance_requests,
            equipment_passports,
            equipment,
            technicians,
            sites
        RESTART IDENTITY CASCADE;
    `);
}

async function seed() {
    await connectDB();
    await clearDb();

    // 1) Sites (2)
    const site1 = await Site.create({
        name: "Moscow North",
        code: "MSK-01",
        region: "Moscow Oblast",
        lat: 55.75,
        lon: 37.61,
    });
    const site2 = await Site.create({
        name: "Kaluga Hub",
        code: "KLG-01",
        region: "Kaluga Oblast",
        lat: 54.51,
        lon: 36.27,
    });

    // 2) Equipment (6)
    const eq1 = await Equipment.create({
        siteId: site1.id,
        name: "Turbine A1",
        type: "turbine",
        serialNumber: "SN-T-001",
        status: "operational",
        installedAt: "2023-05-12",
    });
    const eq2 = await Equipment.create({
        siteId: site1.id,
        name: "Turbine A2",
        type: "turbine",
        serialNumber: "SN-T-002",
        status: "maintenance",
        installedAt: "2023-06-01",
    });
    const eq3 = await Equipment.create({
        siteId: site2.id,
        name: "Inverter C1",
        type: "inverter",
        serialNumber: "SN-I-001",
        status: "operational",
        installedAt: "2024-02-20",
    });
    const eq4 = await Equipment.create({
        siteId: site1.id,
        name: "Sensor B1",
        type: "sensor",
        serialNumber: "SN-S-001",
        status: "fault",
        installedAt: "2024-03-15",
    });
    const eq5 = await Equipment.create({
        siteId: site2.id,
        name: "Substation D1",
        type: "substation",
        serialNumber: "SN-U-001",
        status: "operational",
        installedAt: "2022-11-01",
    });
    const eq6 = await Equipment.create({
        siteId: site2.id,
        name: "Turbine A3",
        type: "turbine",
        serialNumber: "SN-T-003",
        status: "decommissioned",
        installedAt: "2019-04-01",
    });

    const equipmentList = [eq1, eq2, eq3, eq4, eq5, eq6];

    // 3) Passports
    for (const eq of equipmentList) {
        await EquipmentPassport.create({
            equipmentId: eq.id,
            manufacturer: "Generic Power",
            model: `${eq.type}-model`,
            ratedPowerKw: 1000,
            lastInspectionAt: "2025-06-01",
        });
    }

    // 4) Technicians
    const t1 = await Technician.create({
        fullName: "Ivan Petrov",
        specialization: "turbines",
        employeeNumber: "T-001",
    });
    const t2 = await Technician.create({
        fullName: "Anna Smirnova",
        specialization: "electrical",
        employeeNumber: "T-002",
    });
    const t3 = await Technician.create({
        fullName: "Sergey Ivanov",
        specialization: "sensors",
        employeeNumber: "T-003",
    });
    const t4 = await Technician.create({
        fullName: "Olga Kuznetsova",
        specialization: "inverters",
        employeeNumber: "T-004",
    });
    const t5 = await Technician.create({
        fullName: "Dmitry Volkov",
        specialization: "general",
        employeeNumber: "T-005",
    });

    // 5) Requests
    const statuses = ["new", "in_progress", "done"];
    const priorities = ["low", "medium", "high", "critical"];
    const requests = [];

    for (let i = 1; i <= 20; i++) {
        const eq = equipmentList[(i - 1) % 6];
        const status = statuses[(i - 1) % 3];
        const req = await MaintenanceRequest.create({
            equipmentId: eq.id,
            title: `Request #${i}`,
            description: `Seed request number ${i}`,
            priority: priorities[(i - 1) % 4],
            status,
            plannedAt: `2026-09-${String((i % 28) + 1).padStart(2, "0")}T10:00:00.000Z`,
            author: "dispatcher",
        });
        requests.push(req);
    }

    // 6) Status history
    await RequestStatusHistory.create({
        requestId: requests[1].id,
        fromStatus: "new",
        toStatus: "in_progress",
        changedBy: "dispatcher",
        comment: "Started",
    });
    await RequestStatusHistory.create({
        requestId: requests[2].id,
        fromStatus: "in_progress",
        toStatus: "done",
        changedBy: "engineer",
        comment: "Finished",
    });

    // 7) Assignees
    await RequestAssignee.create({
        requestId: requests[1].id,
        technicianId: t1.id,
        role: "lead",
        hours: 8,
    });
    await RequestAssignee.create({
        requestId: requests[1].id,
        technicianId: t2.id,
        role: "member",
        hours: 4,
    });
    await RequestAssignee.create({
        requestId: requests[4].id,
        technicianId: t3.id,
        role: "lead",
        hours: 6,
    });
    await RequestAssignee.create({
        requestId: requests[7].id,
        technicianId: t4.id,
        role: "lead",
        hours: 3,
    });
    await RequestAssignee.create({
        requestId: requests[10].id,
        technicianId: t5.id,
        role: "lead",
        hours: 5,
    });

    console.log("Seed OK:");
    console.log("- sites: 2");
    console.log("- equipment: 6");
    console.log("- technicians: 5");
    console.log("- requests: 20");

    await closeDB();
}

seed().catch(async (err) => {
    console.error(err);
    await closeDB().catch(() => {});
    process.exit(1);
});
