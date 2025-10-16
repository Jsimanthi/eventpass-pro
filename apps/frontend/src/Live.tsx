import React from 'react';
import useWebSocket from './hooks/useWebSocket';

const Live: React.FC = () => {
  const checkIns = useWebSocket(`wss://localhost:8080/ws`);

  return (
    <div>
      <h1>Live Check-ins</h1>
      <ul>
        {checkIns.map((checkIn, index) => (
          <li key={index}>
            {checkIn.email} - {new Date(checkIn.gift_claimed_at).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Live;
