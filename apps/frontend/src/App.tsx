import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

// Import global design system
import './styles/design-system/index.css';

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

// Navigation Icons (using Lucide React icons)
import {
  BarChart3,
  Radio,
  Users,
  Settings,
  Smartphone,
  Clock,
  Shield,
  Printer,
  Menu,
  X
} from 'lucide-react';

const DashboardIcon = () => <BarChart3 size={20} />;
const LiveIcon = () => <Radio size={20} />;
const UsersIcon = () => <Users size={20} />;
const SettingsIcon = () => <Settings size={20} />;
const ScanIcon = () => <Smartphone size={20} />;
const QueueIcon = () => <Clock size={20} />;
const PrivacyIcon = () => <Shield size={20} />;
const ReprintIcon = () => <Printer size={20} />;
const MenuIcon = () => <Menu size={20} />;
const CloseIcon = () => <X size={20} />;

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
        aria-label="Toggle sidebar menu"
      >
        <MenuIcon />
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
            <Route path="/" element={<Login />} />
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
