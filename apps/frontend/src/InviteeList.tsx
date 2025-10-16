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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

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

  const filteredInvitees = invitees.filter(invitee => {
    return (
      invitee.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === '' || invitee.status === statusFilter)
    );
  });

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h3>Invitees</h3>
      <div>
        <input
          type="text"
          placeholder="Search by email"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="checked_in">Checked In</option>
          <option value="expired">Expired</option>
          <option value="denied">Denied</option>
        </select>
      </div>
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
          {filteredInvitees.map(invitee => (
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
