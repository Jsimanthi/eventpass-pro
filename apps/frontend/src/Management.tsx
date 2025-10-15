import React, { useState } from 'react';

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
    } catch (error) {
      setMessage(`Error: ${error}`);
    }
  };

  return (
    <div>
      <h1>Reprint Invitee QR Code</h1>
      <input
        type="text"
        placeholder="Invitee ID"
        value={inviteeId}
        onChange={(e) => setInviteeId(e.target.value)}
      />
      <button onClick={handleReprint}>Reprint</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Management;
