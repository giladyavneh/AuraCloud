import { useAuth } from "@/context/auth/AuthContext";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

// Blocks authenticated users who haven't connected AWS yet — redirects to /onboard
const OnboardGuard: React.FC = () => {
  const { customer } = useAuth();

  if (!customer?.hasAwsConnected) return <Navigate to="/onboard" replace />;

  return <Outlet />;
};

export default OnboardGuard;
