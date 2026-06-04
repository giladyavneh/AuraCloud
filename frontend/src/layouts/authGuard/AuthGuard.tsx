import { useAuth } from "@/context/auth/AuthContext";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

// Blocks unauthenticated users — redirects to /login
const AuthGuard: React.FC = () => {
  const { customer, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!customer) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default AuthGuard;
