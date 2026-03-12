const authorizeRoles = require("./authorizeRoles");

module.exports = authorizeRoles("superadmin", "admin", "editor");
