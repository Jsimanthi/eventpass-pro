import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Live from './Live';
import Management from './Management';

const App: React.FC = () => {
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
          </ul>
        </nav>

        <hr />

        <Routes>
          <Route path="/live" element={<Live />} />
          <Route path="/management" element={<Management />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
