import { useAuth } from "@/context/auth/AuthContext";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Two-step onboarding guard:
 * 1. Managers who haven't saved company AWS credentials yet → /onboard
 * 2. Anyone (manager or employee) who hasn't linked their AWS user yet → /select-aws-user
 */
const OnboardGuard: React.FC = () => {
  const { customer } = useAuth();

  // Step 1: manager must connect company AWS credentials first
  if (customer?.role === 'manager' && !customer.companyAwsAccessKeyId) {
    return <Navigate to="/onboard" replace />;
  }

  // Step 2: both roles must have selected their personal AWS user
  if (!customer?.hasAwsConnected) {
    return <Navigate to="/select-aws-user" replace />;
  }

  return <Outlet />;
};

export default OnboardGuard;
