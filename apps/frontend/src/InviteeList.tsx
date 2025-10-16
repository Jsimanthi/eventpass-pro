import React, { useState, useEffect } from 'react';

interface Invitee {
  id: number;
  email: string;
  status: string;
  qr_code_url: string;
}

interface InviteeListProps {
  eventId: number;
}

const InviteeList: React.FC<InviteeListProps> = ({ eventId }) => {
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchInvitees = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/invitees`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        const data = await response.json();
        setInvitees(data);
      } catch (error: any) {
        setError(error);
      }
    };

    if (eventId) {
      fetchInvitees();
    }
  }, [eventId]);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h3>Invitees</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Status</th>
            <th>QR Code</th>
          </tr>
        </thead>
        <tbody>
          {invitees.map(invitee => (
            <tr key={invitee.id}>
              <td>{invitee.id}</td>
              <td>{invitee.email}</td>
              <td>{invitee.status}</td>
              <td>
                {invitee.qr_code_url && (
                  <img src={invitee.qr_code_url} alt={`QR Code for ${invitee.email}`} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InviteeList;
