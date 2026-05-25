import AuthGuard from "@/layouts/authGuard/AuthGuard";
import OnboardGuard from "@/layouts/authGuard/OnboardGuard";
import PageWrapper from "@/layouts/pageWrapper/PageWrapper";
import Dashboard from "@/pages/dashboard/Dashboard";
import Login from "@/pages/login/Login";
import Onboard from "@/pages/onboard/Onboard";
import ResourceWatchlist from "@/pages/resourceWatchlist/ResourceWatchlist";
import Settings from "@/pages/settings/Settings";
import SignUp from "@/pages/signUp/SignUp";
import { Navigate, Route, Routes } from "react-router-dom";

const App = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/sign-up" element={<SignUp />} />

    {/* Protected: must be authenticated */}
    <Route element={<AuthGuard />}>
      {/* Onboard: authenticated but AWS not yet connected */}
      <Route path="/onboard" element={<Onboard />} />

      {/* Protected: must be authenticated + AWS connected */}
      <Route element={<OnboardGuard />}>
        <Route element={<PageWrapper />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resource-watch-list" element={<ResourceWatchlist />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default App;
