import React, { useMemo } from 'react';
import useWebSocket from './hooks/useWebSocket';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Live.css';

interface CheckIn {
  email: string;
  gift_claimed_at: string;
}

const Live: React.FC = () => {
  const checkIns = useWebSocket<CheckIn>(`wss://localhost:8080/ws`);

  const chartData = useMemo(() => {
    const data: { [key: string]: number } = {};
    checkIns.forEach(checkIn => {
      const time = new Date(checkIn.gift_claimed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (data[time]) {
        data[time]++;
      } else {
        data[time] = 1;
      }
    });
    return Object.entries(data).map(([time, count]) => ({ time, count }));
  }, [checkIns]);

  return (
    <div className="container">
      <h1 className="title">Live Check-ins</h1>
      <div className="card">
        <h2 className="card-title">Total Check-ins</h2>
        <p className="card-content">{checkIns.length}</p>
      </div>
      <div className="card">
        <h2 className="card-title">Check-ins Over Time</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <h2 className="card-title">Check-in Feed</h2>
        <ul className="check-in-list">
          {checkIns.map((checkIn, index) => (
            <li key={index} className="check-in-item">
              <span>{checkIn.email}</span>
              <span>{new Date(checkIn.gift_claimed_at).toLocaleTimeString()}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Live;
