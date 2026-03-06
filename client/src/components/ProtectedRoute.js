import React from "react";
import { Navigate } from "react-router-dom";
import { getUserRole, isAuthenticated } from "../services/auth";

function ProtectedRoute({ children, allowedRoles = [] }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    const role = getUserRole();
    if (!role) {
      return <Navigate to="/login" replace />;
    }
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
