import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Live from './Live';
import Management from './Management';
import Login from './Login';
import Registration from './Registration';
import ReprintRequests from './ReprintRequests';
import UserManagement from './UserManagement';
import QueueMonitoring from './QueueMonitoring';
import PrivacyControls from './PrivacyControls';
import PrivateRoute from './PrivateRoute';
import Scan from './Scan';

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
      </div>
    </Router>
  );
};

export default App;
