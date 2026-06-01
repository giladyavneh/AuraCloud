import AuthGuard from "@/layouts/authGuard/AuthGuard";
import OnboardGuard from "@/layouts/authGuard/OnboardGuard";
import PageWrapper from "@/layouts/pageWrapper/PageWrapper";
import CompanyLanding from "@/pages/companyLanding/CompanyLanding";
import CompanySignUp from "@/pages/companySignUp/CompanySignUp";
import Dashboard from "@/pages/dashboard/Dashboard";
import Login from "@/pages/login/Login";
import Onboard from "@/pages/onboard/Onboard";
import ResourceWatchlist from "@/pages/resourceWatchlist/ResourceWatchlist";
import SelectAwsUser from "@/pages/selectAwsUser/SelectAwsUser";
import Settings from "@/pages/settings/Settings";
import SignUp from "@/pages/signUp/SignUp";
import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const App: React.FC = () => (
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={<Login />} />
    <Route path="/sign-up" element={<SignUp />} />

    {/* Company entry points — public, slug-scoped */}
    <Route path="/:slug" element={<CompanyLanding />} />
    <Route path="/:slug/sign-up" element={<CompanySignUp />} />

    {/* Protected: must be authenticated */}
    <Route element={<AuthGuard />}>
      {/* Onboard: manager connects company AWS credentials */}
      <Route path="/onboard" element={<Onboard />} />

      {/* Select AWS user: both roles pick their personal IAM/SSO identity */}
      <Route path="/select-aws-user" element={<SelectAwsUser />} />

      {/* Protected: must be authenticated + fully onboarded */}
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
