import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Lazy load components for better performance
const Login = lazy(() => import('./Login.tsx'));
const Registration = lazy(() => import('./Registration.tsx'));
const Live = lazy(() => import('./Live.tsx'));
const Management = lazy(() => import('./Management.tsx'));
const UserManagement = lazy(() => import('./UserManagement.tsx'));
const Scan = lazy(() => import('./Scan.tsx'));
const ReprintRequests = lazy(() => import('./ReprintRequests.tsx'));
const QueueMonitoring = lazy(() => import('./QueueMonitoring.tsx'));
const PrivacyControls = lazy(() => import('./PrivacyControls.tsx'));

// Loading component
const LoadingSpinner = () => (
  <div className="loading">
    <div className="spinner"></div>
    <span>Loading EventPass Pro...</span>
  </div>
);

// Private Route component
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="app-layout">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Navigate to={isAuthenticated ? "/live" : "/login"} replace />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/live" replace /> : <Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Registration />} />

            <Route path="/live" element={<PrivateRoute><Live /></PrivateRoute>} />
            <Route path="/management" element={<PrivateRoute><Management onLogout={handleLogout} /></PrivateRoute>} />
            <Route path="/user-management" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
            <Route path="/scan" element={<PrivateRoute><Scan /></PrivateRoute>} />
            <Route path="/reprint-requests" element={<PrivateRoute><ReprintRequests /></PrivateRoute>} />
            <Route path="/queue-monitoring" element={<PrivateRoute><QueueMonitoring /></PrivateRoute>} />
            <Route path="/privacy-controls" element={<PrivateRoute><PrivacyControls /></PrivateRoute>} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;