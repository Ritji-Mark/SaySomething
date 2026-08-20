import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { homePathForRole, ROLES, STAFF_ROLES } from "./utils/roles.js";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import StaffLogin from "./pages/StaffLogin.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import ReportsList from "./pages/ReportsList.jsx";
import NewReport from "./pages/NewReport.jsx";
import ReportDetail from "./pages/ReportDetail.jsx";
import Notifications from "./pages/Notifications.jsx";
import StaffDashboard from "./pages/StaffDashboard.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminAuthorities from "./pages/AdminAuthorities.jsx";
import AdminRouting from "./pages/AdminRouting.jsx";

// Sends visitors to the right landing page for their role (or to login).
function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={homePathForRole(user?.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin/login" element={<StaffLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Authenticated app shell */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Citizen */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
              <ReportsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/new"
          element={
            <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
              <NewReport />
            </ProtectedRoute>
          }
        />

        {/* Shared report detail — access is enforced server-side per role */}
        <Route path="/reports/:id" element={<ReportDetail />} />

        {/* Staff (Authority + Administrator) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={STAFF_ROLES}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Administrator only */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMINISTRATOR]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/authorities"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMINISTRATOR]}>
              <AdminAuthorities />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/routing"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMINISTRATOR]}>
              <AdminRouting />
            </ProtectedRoute>
          }
        />

        {/* Everyone authenticated */}
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}
