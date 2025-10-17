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
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

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

      const eventsData = await response.json();
      setEvents(eventsData);

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

  const handleExport = async () => {
    if (checkIns.length === 0) {
      return;
    }

    try {
      setExporting(true);
      
      const csvContent = "data:text/csv;charset=utf-8,"
        + ["Email", "Gift Claimed At", "Event"].join(",") + "\n"
        + checkIns.map(checkIn => `"${checkIn.email}","${checkIn.gift_claimed_at}","All Events"`).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `check-ins-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const totalInvitees = events.reduce((sum, event) => sum + (event.total_invitees || 0), 0);
  const totalCheckedIn = events.reduce((sum, event) => sum + (event.checked_in_count || 0), 0);
  const checkInRate = totalInvitees > 0 ? Math.round((totalCheckedIn / totalInvitees) * 100) : 0;

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Dashboard Error</h1>
          </div>
          <div className="card-content">
            <p style={{ color: 'var(--error-color)', marginBottom: 'var(--space-4)' }}>
              Error: {error}
            </p>
            <button onClick={fetchCheckIns} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Event Management Dashboard</h1>
          <p className="card-subtitle">Overview of all your events and check-in statistics</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 'var(--space-6)',
        marginBottom: 'var(--space-8)'
      }}>
        <div className="card">
          <div className="card-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-xl)'
              }}>
                📊
              </div>
              <div>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
                  {events.length}
                </p>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
                  Total Events
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--secondary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-xl)'
              }}>
                👥
              </div>
              <div>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
                  {totalInvitees}
                </p>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
                  Total Invitees
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--success-color)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-xl)'
              }}>
                ✅
              </div>
              <div>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
                  {totalCheckedIn}
                </p>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
                  Checked In
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-xl)'
              }}>
                📈
              </div>
              <div>
                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
                  {checkInRate}%
                </p>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
                  Check-in Rate
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions and Export */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Quick Actions</h2>
        </div>
        <div className="card-content">
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleExport}
              disabled={checkIns.length === 0 || exporting}
              className="btn btn-success"
            >
              {exporting ? (
                <>
                  <div className="spinner"></div>
                  Exporting...
                </>
              ) : (
                <>
                  📥 Export CSV ({checkIns.length} records)
                </>
              )}
            </button>
            <button
              onClick={fetchCheckIns}
              className="btn btn-outline"
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <EventList />
    </div>
  );
};

export default Management;
