import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { CreateSurvey } from './pages/CreateSurvey';
import { SurveyDetail } from './pages/SurveyDetail';
import { SurveyAnalytics } from './pages/SurveyAnalytics';
import { Landing } from './pages/Landing';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import SurveyResponsePage from "./pages/SurveyResponsePage.tsx";


function App() {
  const { getProfile, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (localStorage.getItem('token')) {
      getProfile();
    }
  }, [getProfile]);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <Navbar />}
        <Routes>
          {/* Public routes */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Landing />
              )
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register />
              )
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-survey"
            element={
              <ProtectedRoute>
                <CreateSurvey />
              </ProtectedRoute>
            }
          />
          <Route
            path="/survey/:id"
            element={
              <ProtectedRoute>
                <SurveyDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/survey/:id/analytics"
            element={
              <ProtectedRoute>
                <SurveyAnalytics />
              </ProtectedRoute>
            }
          />
            <Route path="/survey-response/:surveyId" element={<SurveyResponsePage />} />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App