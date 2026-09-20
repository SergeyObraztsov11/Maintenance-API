import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import "dotenv/config";
import { config } from "../config/index.js";

const equipment = [
    {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Turbine A1",
        type: "turbine",
        serialNumber: "SN-T-001",
        location: { lat: 55.75, lon: 37.61 },
        status: "operational",
        installedAt: "2023-05-12",
        createdAt: "2023-05-12T10:00:00.000Z",
        updatedAt: "2023-05-12T10:00:00.000Z",
    },
    {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Turbine A2",
        type: "turbine",
        serialNumber: "SN-T-002",
        location: { lat: 55.76, lon: 37.62 },
        status: "maintenance",
        installedAt: "2023-06-01",
        createdAt: "2023-06-01T10:00:00.000Z",
        updatedAt: "2024-01-10T08:00:00.000Z",
    },
    {
        id: "33333333-3333-3333-3333-333333333333",
        name: "Inverter C1",
        type: "inverter",
        serialNumber: "SN-I-001",
        location: { lat: 55.74, lon: 37.6 },
        status: "operational",
        installedAt: "2024-02-20",
        createdAt: "2024-02-20T10:00:00.000Z",
        updatedAt: "2024-02-20T10:00:00.000Z",
    },
    {
        id: "44444444-4444-4444-4444-444444444444",
        name: "Sensor B1",
        type: "sensor",
        serialNumber: "SN-S-001",
        location: { lat: 55.77, lon: 37.63 },
        status: "fault",
        installedAt: "2024-03-15",
        createdAt: "2024-03-15T10:00:00.000Z",
        updatedAt: "2024-08-01T12:00:00.000Z",
    },
    {
        id: "55555555-5555-5555-5555-555555555555",
        name: "Substation D1",
        type: "substation",
        serialNumber: "SN-U-001",
        location: { lat: 55.73, lon: 37.59 },
        status: "operational",
        installedAt: "2022-11-01",
        createdAt: "2022-11-01T10:00:00.000Z",
        updatedAt: "2022-11-01T10:00:00.000Z",
    },
    {
        id: "66666666-6666-6666-6666-666666666666",
        name: "Turbine A3",
        type: "turbine",
        serialNumber: "SN-T-003",
        location: { lat: 55.78, lon: 37.64 },
        status: "decommissioned",
        installedAt: "2019-04-01",
        createdAt: "2019-04-01T10:00:00.000Z",
        updatedAt: "2025-12-01T10:00:00.000Z",
    },
];

const requests = [
    {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        equipmentId: "11111111-1111-1111-1111-111111111111",
        title: "Inspect blade bearings",
        description: "Scheduled outdoor inspection of main bearings",
        priority: "medium",
        status: "new",
        plannedAt: "2026-09-25T09:00:00.000Z",
        createdAt: "2026-09-18T12:00:00.000Z",
        updatedAt: "2026-09-18T12:00:00.000Z",
    },
    {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        equipmentId: "22222222-2222-2222-2222-222222222222",
        title: "Replace gearbox oil",
        description: "Routine maintenance while unit is offline",
        priority: "high",
        status: "in_progress",
        plannedAt: "2026-09-21T08:00:00.000Z",
        createdAt: "2026-09-15T09:00:00.000Z",
        updatedAt: "2026-09-20T07:30:00.000Z",
    },
    {
        id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        equipmentId: "33333333-3333-3333-3333-333333333333",
        title: "Firmware update",
        description: "Apply vendor patch for inverter controller",
        priority: "low",
        status: "done",
        plannedAt: "2026-09-10T11:00:00.000Z",
        createdAt: "2026-09-01T10:00:00.000Z",
        updatedAt: "2026-09-10T15:00:00.000Z",
    },
    {
        id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
        equipmentId: "44444444-4444-4444-4444-444444444444",
        title: "Diagnose sensor fault",
        description: "Intermittent readings on wind sensor",
        priority: "critical",
        status: "new",
        plannedAt: "2026-09-22T07:00:00.000Z",
        createdAt: "2026-09-19T14:00:00.000Z",
        updatedAt: "2026-09-19T14:00:00.000Z",
    },
    {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        equipmentId: "55555555-5555-5555-5555-555555555555",
        title: "Thermal camera survey",
        description: "Check busbar connections",
        priority: "medium",
        status: "rejected",
        plannedAt: null,
        createdAt: "2026-08-20T10:00:00.000Z",
        updatedAt: "2026-08-25T12:00:00.000Z",
    },
    {
        id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
        equipmentId: "11111111-1111-1111-1111-111111111111",
        title: "Lubricate yaw system",
        description: "Outdoor work, weather-dependent",
        priority: "high",
        status: "in_progress",
        plannedAt: "2026-09-23T06:00:00.000Z",
        createdAt: "2026-09-17T08:00:00.000Z",
        updatedAt: "2026-09-20T06:00:00.000Z",
    },
];

await mkdir(config.dataDir, { recursive: true });

await writeFile(
    path.join(config.dataDir, "equipment.json"),
    JSON.stringify(equipment, null, 2),
    "utf8",
);

await writeFile(
    path.join(config.dataDir, "requests.json"),
    JSON.stringify(requests, null, 2),
    "utf8",
);

console.log(`Seeded data into ${config.dataDir}/`);
