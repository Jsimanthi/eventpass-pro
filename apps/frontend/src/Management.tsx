import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Users,
  CheckCircle,
  TrendingUp,
  Download,
  RefreshCw,
  Calendar,
  UserCheck,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface ManagementProps {
  onLogout: () => void;
}

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  total_invitees?: number;
  checked_in_count?: number;
}

interface CheckIn {
  email: string;
  gift_claimed_at: string;
}

const Management: React.FC<ManagementProps> = ({ onLogout }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events', {
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
      for (const event of eventsData) {
        try {
          const inviteesResponse = await fetch(`/api/events/${event.id}/invitees`, {
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
      console.error('Error fetching data:', err);
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
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-12)' }}>
        <div className="card">
          <div className="card-header">
            <h1 className="card-title">Dashboard Error</h1>
          </div>
          <div className="card-content">
            <p style={{ color: 'var(--error-600)', marginBottom: 'var(--space-4)' }}>
              Error: {error}
            </p>
            <button onClick={fetchData} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={{
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--gray-200)',
          background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)'
        }}>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--primary-700)',
            marginBottom: 'var(--space-1)'
          }}>
            EventPass Pro
          </h2>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            Management Dashboard
          </p>
        </div>

        <nav style={{ padding: 'var(--space-4)' }}>
          <div style={{
            padding: 'var(--space-3)',
            background: 'var(--primary-50)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--primary-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BarChart3 size={16} color="white" />
              </div>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--primary-700)'
              }}>
                Dashboard Active
              </span>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header style={{
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--gray-200)',
          padding: 'var(--space-4) var(--space-6)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <button
                className="btn btn-ghost"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ display: 'block' }}
              >
                <Menu size={20} />
              </button>
              <h1 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Event Management Dashboard
              </h1>
            </div>

            <button
              onClick={onLogout}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        <div className="content-area">
          {/* Metrics Cards */}
          <div className="grid grid-cols-4" style={{
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
                    background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Calendar size={24} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      margin: 0,
                      color: 'var(--text-primary)'
                    }}>
                      {events.length}
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
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
                    background: 'linear-gradient(135deg, var(--success-500) 0%, var(--success-600) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      margin: 0,
                      color: 'var(--text-primary)'
                    }}>
                      {totalInvitees}
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
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
                    background: 'linear-gradient(135deg, var(--warning-500) 0%, var(--warning-600) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <UserCheck size={24} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      margin: 0,
                      color: 'var(--text-primary)'
                    }}>
                      {totalCheckedIn}
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
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
                    background: 'linear-gradient(135deg, var(--error-500) 0%, var(--error-600) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      margin: 0,
                      color: 'var(--text-primary)'
                    }}>
                      {checkInRate}%
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Check-in Rate
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
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
                      <div className="spinner" style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }}></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={16} style={{ marginRight: 'var(--space-2)' }} />
                      Export CSV ({checkIns.length} records)
                    </>
                  )}
                </button>
                <button
                  onClick={fetchData}
                  className="btn btn-outline"
                >
                  <RefreshCw size={16} style={{ marginRight: 'var(--space-2)' }} />
                  Refresh Data
                </button>
              </div>
            </div>
          </div>

          {/* Events Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Events Overview</h2>
              <p className="card-subtitle">Manage your events and track performance</p>
            </div>
            <div className="card-content">
              {events.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--space-12)',
                  color: 'var(--text-secondary)'
                }}>
                  <p style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)' }}>
                    No events found
                  </p>
                  <p>Create your first event to get started with EventPass Pro.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Date</th>
                        <th>Invitees</th>
                        <th>Checked In</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(event => {
                        const isValidDate = event.date && !isNaN(new Date(event.date).getTime());
                        const formattedDate = isValidDate ? new Date(event.date).toLocaleString() : 'Invalid Date';
                        const checkInRate = event.total_invitees && event.total_invitees > 0
                          ? Math.round((event.checked_in_count || 0) / event.total_invitees * 100)
                          : 0;

                        return (
                          <tr key={event.id}>
                            <td style={{ fontWeight: 'var(--font-weight-medium)' }}>
                              #{event.id}
                            </td>
                            <td style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                              {event.name || 'Unnamed Event'}
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {event.location || 'No Location'}
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {formattedDate}
                            </td>
                            <td>
                              <span className="badge badge-success">
                                {event.total_invitees || 0}
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-warning">
                                {event.checked_in_count || 0}
                              </span>
                            </td>
                            <td>
                              {checkInRate >= 80 ? (
                                <span className="badge badge-success">Excellent</span>
                              ) : checkInRate >= 60 ? (
                                <span className="badge badge-warning">Good</span>
                              ) : (
                                <span className="badge badge-error">Needs Attention</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Management;