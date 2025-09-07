import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/Dashboard";
import PVNavbar from "./ui/PVNavbar";

function Shell({ children }) {
  const { user, logout } = useAuth();
  return (
    <>
      <PVNavbar user={user} onLogout={logout} />
      <main className="container" style={{ paddingTop: 24 }}>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <Shell><Login /></Shell>
          } />
          <Route path="/register" element={
            <Shell><Register /></Shell>
          } />
          <Route path="/" element={
            <ProtectedRoute>
              <Shell><Dashboard /></Shell>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
