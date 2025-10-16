import React, { useState } from 'react';
import EventList from './EventList';

const Management: React.FC = () => {
  const [inviteeId, setInviteeId] = useState('');
  const [message, setMessage] = useState('');

  const handleReprint = async () => {
    try {
      const response = await fetch(`/invitees/${inviteeId}/reprint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (response.ok) {
        const responseBody = await response.text();
        setMessage(responseBody);
      } else {
        const errorText = await response.text();
        setMessage(`Error: ${errorText}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Management</h1>
      
      <hr />

      <h2>Reprint Invitee QR Code</h2>
      <input
        type="text"
        placeholder="Invitee ID"
        value={inviteeId}
        onChange={(e) => setInviteeId(e.target.value)}
      />
      <button onClick={handleReprint}>Reprint</button>
      {message && <p>{message}</p>}

      <hr />

      <EventList />
    </div>
  );
};

export default Management;
