import React, { useState, useEffect } from 'react';
import EventList from './EventList';

declare global {
  interface ImportMeta {
    env: {
      VITE_API_URL?: string;
    };
  }
}

interface CheckIn {
  email: string;
  gift_claimed_at: string;
}

const Management: React.FC = () => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckIns();
  }, []);

  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/events`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.statusText}`);
      }

      const events = await response.json();

      // Get check-ins for all events
      const allCheckIns: CheckIn[] = [];
      for (const event of events) {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
          const inviteesResponse = await fetch(`${baseUrl}/api/events/${event.id}/invitees`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });

          if (inviteesResponse.ok) {
            const invitees = await inviteesResponse.json();
            const eventCheckIns = invitees
              .filter((invitee: any) => invitee.gift_claimed_at)
              .map((invitee: any) => ({
                email: invitee.email,
                gift_claimed_at: invitee.gift_claimed_at
              }));
            allCheckIns.push(...eventCheckIns);
          }
        } catch (err) {
          console.error(`Failed to fetch invitees for event ${event.id}:`, err);
        }
      }

      setCheckIns(allCheckIns);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching check-ins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (checkIns.length === 0) {
      alert('No check-ins to export');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Email", "Gift Claimed At"].join(",") + "\n"
      + checkIns.map(checkIn => `"${checkIn.email}","${checkIn.gift_claimed_at}"`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "check-ins.csv");
    document.body.appendChild(link);
    link.click();
  };

  if (loading) {
    return (
      <div>
        <h1>Management</h1>
        <p>Loading check-ins...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Management</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button onClick={fetchCheckIns}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Management</h1>
      <div style={{ marginBottom: '20px' }}>
        <p>Total Check-ins: {checkIns.length}</p>
        <button onClick={handleExport} disabled={checkIns.length === 0}>
          Export to CSV ({checkIns.length} records)
        </button>
      </div>
      <EventList />
    </div>
  );
};

export default Management;
