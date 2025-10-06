// client/src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/Dashboard";

import PVNavbar from "./ui/PVNavbar";
import ProfileModal from "./components/ProfileModal";
import TracksPage from "./pages/TracksPage";  
import TrackQuestionsPage from "./pages/TrackQuestionsPage";

import ResumeLanding from "./pages/ResumeLanding";
import ResumeResult from "./pages/ResumeResult";


function Shell({ children }) {
  const { user, logout } = useAuth();

  // ✅ this is the “state to open/close the modal”
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      {/* pass a function that opens the modal */}
      <PVNavbar user={user} onLogout={logout} onProfile={() => setProfileOpen(true)} />

      <main className="container" style={{ paddingTop: 24 }}>{children}</main>

      {/* render the modal, and give it a close callback */}
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Shell><Login /></Shell>} />
          <Route path="/register" element={<Shell><Register /></Shell>} />
          <Route path="/tracks" element={<TracksPage />} />
          <Route path="/profile" element={<ProfileModal />} />
          <Route path="/tracks/:topicSlug/:difficulty" element={<TrackQuestionsPage />} />
          <Route path="/resume" element={<Shell><ResumeLanding /></Shell>} />
            <Route path="/resume/result" element={<Shell><ResumeResult /></Shell>} />
            
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Shell><Dashboard /></Shell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
