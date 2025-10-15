import React, { useEffect, useState } from 'react';

const Live: React.FC = () => {
  const [checkIns, setCheckIns] = useState<any[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws`);

    ws.onmessage = (event) => {
      const checkIn = JSON.parse(event.data);
      setCheckIns((prevCheckIns) => [checkIn, ...prevCheckIns]);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div>
      <h1>Live Check-ins</h1>
      <ul>
        {checkIns.map((checkIn) => (
          <li key={checkIn.id}>
            {checkIn.email} - {new Date(checkIn.gift_claimed_at).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Live;
