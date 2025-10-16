import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Live from './Live';
import Management from './Management';
import Login from './Login';
import Registration from './Registration';
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
            path="/scan"
            element={<PrivateRoute><Scan /></PrivateRoute>}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
