import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Lazy load components for code splitting
const Live = lazy(() => import('./Live'));
const Management = lazy(() => import('./Management'));
const Login = lazy(() => import('./Login'));
const Registration = lazy(() => import('./Registration'));
const ReprintRequests = lazy(() => import('./ReprintRequests'));
const UserManagement = lazy(() => import('./UserManagement'));
const QueueMonitoring = lazy(() => import('./QueueMonitoring'));
const PrivacyControls = lazy(() => import('./PrivacyControls'));
const Scan = lazy(() => import('./Scan'));

// Eager load critical components
import PrivateRoute from './PrivateRoute';

const App: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/live">Live</Link>
            </li>
            <li>
              <Link to="/management">Management</Link>
            </li>
            <li>
              <Link to="/reprint-requests">Reprint Requests</Link>
            </li>
            <li>
              <Link to="/user-management">User Management</Link>
            </li>
            <li>
              <Link to="/queue-monitoring">Queue Monitoring</Link>
            </li>
            <li>
              <Link to="/privacy-controls">Privacy Controls</Link>
            </li>
            <li>
              <Link to="/scan">Scan</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/register">Register</Link>
            </li>
            <li>
              <button onClick={handleLogout}>Logout</button>
            </li>
          </ul>
        </nav>

        <hr />

        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Registration />} />
            <Route
              path="/live"
              element={<PrivateRoute><Live /></PrivateRoute>}
            />
            <Route
              path="/management"
              element={<PrivateRoute><Management /></PrivateRoute>}
            />
            <Route
              path="/reprint-requests"
              element={<PrivateRoute><ReprintRequests /></PrivateRoute>}
            />
            <Route
              path="/user-management"
              element={<PrivateRoute><UserManagement /></PrivateRoute>}
            />
            <Route
              path="/queue-monitoring"
              element={<PrivateRoute><QueueMonitoring /></PrivateRoute>}
            />
            <Route
              path="/privacy-controls"
              element={<PrivateRoute><PrivacyControls /></PrivateRoute>}
            />
            <Route
              path="/scan"
              element={<PrivateRoute><Scan /></PrivateRoute>}
            />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
};

export default App;
