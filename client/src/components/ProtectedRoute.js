import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getCurrentUser, isAuthenticated } from "../services/auth";

function ProtectedRoute({ children, requireAdmin = false }) {
  const location = useLocation();
  const user = getCurrentUser();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
