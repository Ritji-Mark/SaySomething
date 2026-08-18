import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ReportsList from "./pages/ReportsList.jsx";
import NewReport from "./pages/NewReport.jsx";
import ReportDetail from "./pages/ReportDetail.jsx";
import Notifications from "./pages/Notifications.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected (rendered inside the app shell) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/reports" element={<ReportsList />} />
        <Route path="/reports/new" element={<NewReport />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
        <Route path="/notifications" element={<Notifications />} />
      </Route>

      <Route path="/" element={<Navigate to="/reports" replace />} />
      <Route path="*" element={<Navigate to="/reports" replace />} />
    </Routes>
  );
}
