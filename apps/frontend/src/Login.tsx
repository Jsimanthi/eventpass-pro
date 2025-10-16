import React, { useState } from 'react';
import axios from 'axios';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('/api/login', {
        email,
        password,
      });

      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        setMessage('Login successful');
        // Redirect to the management page or another protected route
        window.location.href = '/management';
      } else {
        setMessage(`Error: ${response.data.message}`);
      }
    } catch (error: any) {
      if (error.response) {
        setMessage(`Error: ${error.response.data.message}`);
      } else {
        setMessage(`Error: ${error.message}`);
      }
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;
