import { Site } from "./Site.js";
import { Equipment } from "./Equipment.js";
import { EquipmentPassport } from "./EquipmentPassport.js";
import { Technician } from "./Technician.js";
import { MaintenanceRequest } from "./MaintenanceRequest.js";
import { RequestStatusHistory } from "./RequestStatusHistory.js";
import { RequestAssignee } from "./RequestAssignee.js";

// Site 1:N Equipment
Site.hasMany(Equipment, { foreignKey: "siteId", as: "equipment" });
Equipment.belongsTo(Site, { foreignKey: "siteId", as: "site" });

// Equipment 1:1 Passport
Equipment.hasOne(EquipmentPassport, {
    foreignKey: "equipmentId",
    as: "passport",
});
EquipmentPassport.belongsTo(Equipment, {
    foreignKey: "equipmentId",
    as: "equipment",
});

// Equipment 1:N Requests
Equipment.hasMany(MaintenanceRequest, {
    foreignKey: "equipmentId",
    as: "requests",
});
MaintenanceRequest.belongsTo(Equipment, {
    foreignKey: "equipmentId",
    as: "equipment",
});

// Request 1:N Status history
MaintenanceRequest.hasMany(RequestStatusHistory, {
    foreignKey: "requestId",
    as: "statusHistory",
});
RequestStatusHistory.belongsTo(MaintenanceRequest, {
    foreignKey: "requestId",
    as: "request",
});

// Request N:M Technician through RequestAssignee (extra fields: role, hours)
MaintenanceRequest.belongsToMany(Technician, {
    through: RequestAssignee,
    foreignKey: "requestId",
    otherKey: "technicianId",
    as: "technicians",
});
Technician.belongsToMany(MaintenanceRequest, {
    through: RequestAssignee,
    foreignKey: "technicianId",
    otherKey: "requestId",
    as: "requests",
});

MaintenanceRequest.hasMany(RequestAssignee, {
    foreignKey: "requestId",
    as: "assignees",
});
RequestAssignee.belongsTo(MaintenanceRequest, {
    foreignKey: "requestId",
    as: "request",
});
RequestAssignee.belongsTo(Technician, {
    foreignKey: "technicianId",
    as: "technician",
});
Technician.hasMany(RequestAssignee, {
    foreignKey: "technicianId",
    as: "assignments",
});

export const models = {
    Site,
    Equipment,
    EquipmentPassport,
    Technician,
    MaintenanceRequest,
    RequestStatusHistory,
    RequestAssignee,
};

export {
    Site,
    Equipment,
    EquipmentPassport,
    Technician,
    MaintenanceRequest,
    RequestStatusHistory,
    RequestAssignee,
};
