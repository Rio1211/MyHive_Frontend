import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login"; 
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import PrivateRoutes from "./utils/PrivateRoutes";
import RoleBaseRoutes from "./utils/RoleBaseRoutes";
import HRDashboard from "./pages/HRDashboard";
import AddEmployeePage from "./pages/AddEmployeePage";
import EditEmployeePage from "./pages/EditEmployeePage";


// Component to display when user tries to access unauthorized content
// Simple components for missing routes
const Unauthorized = () => <div className="min-h-screen flex items-center justify-center bg-gray-50">
  <div className="text-center">
    <h1 className="text-3xl font-bold text-gray-900 mb-4">Unauthorized Access</h1>
    <p className="text-gray-600 mb-6">You don't have permission to view this page.</p>
    <a href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
      Go back to login
    </a>
  </div>
</div>;

// Main application component with routing configuration
function App() {
  return (
     // Wrap application with authentication provider
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          
          {/* Admin routes */}
          <Route path="/admin-dashboard" element={
            <PrivateRoutes>
              <RoleBaseRoutes requiredRole={["admin"]}>
                <SuperAdminDashboard />
              </RoleBaseRoutes>
            </PrivateRoutes>
          } />
          
          {/* Manager routes */}
          <Route path="/manager-dashboard" element={
            <PrivateRoutes>
              <RoleBaseRoutes requiredRole={["manager"]}>
                <ManagerDashboard />
              </RoleBaseRoutes>
            </PrivateRoutes>
          } />

          {/* HR routes */}
          <Route
            path="/hr-dashboard"
            element={
              <PrivateRoutes>
                <RoleBaseRoutes requiredRole={["hr"]}>
                  <HRDashboard />
                </RoleBaseRoutes>
              </PrivateRoutes>
            }
          />
          <Route
            path="/hr/add-employee"
            element={
              <PrivateRoutes>
                <RoleBaseRoutes requiredRole={["hr"]}>
                  <AddEmployeePage />
                </RoleBaseRoutes>
              </PrivateRoutes>
            }
          />
          <Route
            path="/hr/edit-employee/:id"
            element={
              <PrivateRoutes>
                <RoleBaseRoutes requiredRole={["hr"]}>
                  <EditEmployeePage />
                </RoleBaseRoutes>
              </PrivateRoutes>
            }
          />

          
          {/* Employee routes */}
          <Route path="/employee-dashboard" element={
            <PrivateRoutes>
              <RoleBaseRoutes requiredRole={["user"]}>
                <EmployeeDashboard />
              </RoleBaseRoutes>
            </PrivateRoutes>
          } />

          {/* dev (no auth) */}
          {import.meta.env.DEV && (
            <>
              <Route path="/dev-hr" element={<HRDashboard />} />
              <Route path="/dev-manager" element={<ManagerDashboard />} />
              <Route path="/dev-employee" element={<EmployeeDashboard />} />
              <Route path="/dev-superadmin" element={<SuperAdminDashboard />} />

              <Route path="/dev-add-employee" element={<AddEmployeePage />} />
              <Route path="/dev-edit-employee" element={<EditEmployeePage />} />
            </>
          )}
          
          {/* Unauthorized access route */}
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
