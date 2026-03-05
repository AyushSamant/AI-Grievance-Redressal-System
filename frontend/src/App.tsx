// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage   from "./pages/LandingPage";
import LoginPage     from "./pages/LoginPage";
import SignupPage    from "./pages/SignupPage";
import HomePage      from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import TrackingPage  from "./pages/TrackingPage";
import ChatbotPage   from "./pages/ChatbotPage";
import OfficerPage   from "./pages/OfficerPage";
import AdminPage     from "./pages/AdminPage";

function AppRoutes() {
  return (
    <Routes>
      {/* Public landing page — shown at / to everyone */}
      <Route path="/"       element={<LandingPage />} />
      <Route path="/login"  element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Protected — authenticated users go to /home */}
      <Route path="/home" element={
        <ProtectedRoute>
          <Layout><HomePage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><DashboardPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/complaints" element={
        <ProtectedRoute>
          <Layout><ComplaintsPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/tracking" element={
        <ProtectedRoute>
          <Layout><TrackingPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/chatbot" element={
        <ProtectedRoute>
          <Layout><ChatbotPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/officer" element={
        <ProtectedRoute allowedRoles={["OFFICER","ADMIN"]}>
          <Layout><OfficerPage /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={["ADMIN"]}>
          <Layout><AdminPage /></Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}