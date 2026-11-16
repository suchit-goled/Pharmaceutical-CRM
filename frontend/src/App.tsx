import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LogInteraction from "./pages/LogInteraction";
import InteractionHistory from "./pages/InteractionHistory";
import HCPDirectory from "./pages/HCPDirectory";
import HCODirectory from "./pages/HCODirectory";
import ProductCatalogue from "./pages/ProductCatalogue";
import LeadPipeline from "./pages/LeadPipeline";
import TaskManagement from "./pages/TaskManagement";
import CampaignManagement from "./pages/CampaignManagement";
import UserManagement from "./pages/UserManagement";
import AuditLogs from "./pages/AuditLogs";
import Reports from "./pages/Reports";
import NearbyHealthcare from "./pages/NearbyHealthcare";
import MyMedication from "./pages/MyMedication";
import Appointments from "./pages/Appointments";
import PharmacyOrders from "./pages/PharmacyOrders";
import MedicalReports from "./pages/MedicalReports";
import PharmacyInventoryPage from "./pages/PharmacyInventoryPage";
import NotFound from "./pages/NotFound";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500">Verifying Medical Credentials...</p>
        </div>
      </div>
    );
  }

  if (!token && !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<Login />} />

              {/* Core CRM Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nearby-healthcare"
                element={
                  <ProtectedRoute>
                    <NearbyHealthcare />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medications"
                element={
                  <ProtectedRoute>
                    <MyMedication />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/appointments"
                element={
                  <ProtectedRoute>
                    <Appointments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy-orders"
                element={
                  <ProtectedRoute>
                    <PharmacyOrders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medical-reports"
                element={
                  <ProtectedRoute>
                    <MedicalReports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/pharmacy-inventory"
                element={
                  <ProtectedRoute>
                    <PharmacyInventoryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/log-interaction"
                element={
                  <ProtectedRoute>
                    <LogInteraction />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interactions"
                element={
                  <ProtectedRoute>
                    <InteractionHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hcps"
                element={
                  <ProtectedRoute>
                    <HCPDirectory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hcos"
                element={
                  <ProtectedRoute>
                    <HCODirectory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute>
                    <ProductCatalogue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leads"
                element={
                  <ProtectedRoute>
                    <LeadPipeline />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <TaskManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/campaigns"
                element={
                  <ProtectedRoute>
                    <CampaignManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                }
              />

              {/* Administrator Only Routes */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute adminOnly>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-logs"
                element={
                  <ProtectedRoute adminOnly>
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />

              {/* Default Fallback */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
