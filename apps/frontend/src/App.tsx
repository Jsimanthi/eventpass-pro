import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

// Import global styles
import './styles.css';

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

// Navigation Icons (using simple text for now, can be replaced with icon library later)
const DashboardIcon = () => <span>📊</span>;
const LiveIcon = () => <span>🔴</span>;
const UsersIcon = () => <span>👥</span>;
const SettingsIcon = () => <span>⚙️</span>;
const ScanIcon = () => <span>📱</span>;
const QueueIcon = () => <span>⏱️</span>;
const PrivacyIcon = () => <span>🔒</span>;
const ReprintIcon = () => <span>🖨️</span>;

const Navigation: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { path: '/live', label: 'Live Dashboard', icon: LiveIcon },
    { path: '/management', label: 'Management', icon: DashboardIcon },
    { path: '/user-management', label: 'Users', icon: UsersIcon },
    { path: '/scan', label: 'QR Scanner', icon: ScanIcon },
    { path: '/reprint-requests', label: 'Reprint Requests', icon: ReprintIcon },
    { path: '/queue-monitoring', label: 'Queue Monitor', icon: QueueIcon },
    { path: '/privacy-controls', label: 'Privacy', icon: PrivacyIcon },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="btn btn-ghost sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        style={{ display: 'none' }}
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-brand">EventPass</h2>
          <p className="sidebar-subtitle">Event Management System</p>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {navigationItems.map((item) => (
              <li key={item.path} className="sidebar-menu-item">
                <Link
                  to={item.path}
                  className={`sidebar-link ${
                    location.pathname === item.path ? 'active' : ''
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main content area */}
      <div className="main-content">
        <Suspense fallback={
          <div className="loading">
            <div className="spinner"></div>
            Loading...
          </div>
        }>
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

      {/* Logout button - positioned absolutely */}
      <button
        onClick={onLogout}
        className="btn btn-error logout-btn"
        title="Logout"
      >
        Logout
      </button>
    </>
  );
};

const App: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <Router>
      <div className="app">
        <Navigation onLogout={handleLogout} />
      </div>
    </Router>
  );
};

export default App;
