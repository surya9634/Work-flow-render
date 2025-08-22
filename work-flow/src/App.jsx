import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LandingPage from "./pages/WorkFlowLanding";
import Dashboard from "./pages/WorkFlowDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import OnboardingForm from "./pages/OnboardingForm";

// ProtectedRoute component with role-based rendering
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const userString = localStorage.getItem("user");

  let currentUser = null;
  try {
    currentUser = userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    localStorage.removeItem("user");
  }

  const isAuthenticated = !!currentUser;

  if (!isAuthenticated) return <Navigate to="/" replace />;

  if (adminOnly && currentUser.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// OnboardingRoute component to check if user needs onboarding
const OnboardingRoute = ({ children }) => {
  const userString = localStorage.getItem("user");

  let currentUser = null;
  try {
    currentUser = userString ? JSON.parse(userString) : null;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    localStorage.removeItem("user");
    return <Navigate to="/" replace />;
  }

  const isAuthenticated = !!currentUser;

  if (!isAuthenticated) return <Navigate to="/" replace />;

  // If user hasn't completed onboarding and is not admin, redirect to onboarding
  if (!currentUser.onboardingCompleted && currentUser.role !== "admin") {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#333",
            color: "#fff",
          },
          success: {
            style: {
              background: "linear-gradient(to right, #7c3aed, #2563eb)",
            },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Onboarding route - only accessible to authenticated users who haven't completed onboarding */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingForm />
            </ProtectedRoute>
          }
        />

        {/* Regular user and admin route - with onboarding check */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <Dashboard />
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />

        {/* Admin-only route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;