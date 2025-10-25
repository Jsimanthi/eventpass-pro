import React, { useState, useEffect } from 'react';
import {
  Activity,
  Users,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Radio,
  Zap,
  Clock,
  AlertCircle
} from 'lucide-react';

interface LiveData {
  totalEvents: number;
  activeEvents: number;
  totalCheckIns: number;
  checkInsLastHour: number;
  averageCheckInTime: number;
  systemStatus: 'healthy' | 'warning' | 'error';
  recentActivity: Array<{
    id: string;
    type: 'checkin' | 'event_created' | 'user_registered';
    message: string;
    timestamp: string;
  }>;
}

const Live: React.FC = () => {
  const [data, setData] = useState<LiveData>({
    totalEvents: 0,
    activeEvents: 0,
    totalCheckIns: 0,
    checkInsLastHour: 0,
    averageCheckInTime: 0,
    systemStatus: 'healthy',
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLiveData = async () => {
    try {
      // Fetch events data
      const eventsResponse = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (eventsResponse.ok) {
        const events = await eventsResponse.json();
        const activeEvents = events.filter((event: any) =>
          new Date(event.date) >= new Date()
        ).length;

        // Calculate check-ins from events
        const totalCheckIns = events.reduce((sum: number, event: any) =>
          sum + (event.checked_in_count || 0), 0
        );

        setData(prev => ({
          ...prev,
          totalEvents: events.length,
          activeEvents,
          totalCheckIns,
          checkInsLastHour: Math.floor(Math.random() * 50) + 10, // Mock data
          averageCheckInTime: Math.floor(Math.random() * 30) + 15, // Mock data
          systemStatus: 'healthy',
          recentActivity: [
            {
              id: '1',
              type: 'checkin',
              message: 'John Doe checked into Tech Conference 2025',
              timestamp: new Date().toISOString()
            },
            {
              id: '2',
              type: 'event_created',
              message: 'New event "Product Launch" created',
              timestamp: new Date(Date.now() - 300000).toISOString()
            },
            {
              id: '3',
              type: 'user_registered',
              message: 'Sarah Johnson registered for Summer Music Festival',
              timestamp: new Date(Date.now() - 600000).toISOString()
            }
          ]
        }));
      }
    } catch (error) {
      console.error('Failed to fetch live data:', error);
    } finally {
      setLoading(false);
      setLastUpdate(new Date());
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'var(--success-500)';
      case 'warning': return 'var(--warning-500)';
      case 'error': return 'var(--error-500)';
      default: return 'var(--gray-500)';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'checkin': return <CheckCircle size={16} />;
      case 'event_created': return <Activity size={16} />;
      case 'user_registered': return <Users size={16} />;
      default: return <Activity size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <span>Loading live dashboard...</span>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
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
            Live Dashboard
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
                <Radio size={16} color="white" />
              </div>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--primary-700)'
              }}>
                Live Active
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
              <h1 style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                Live Dashboard
              </h1>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-1) var(--space-3)',
                background: 'var(--success-50)',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--success-200)'
              }}>
                <div style={{
                  width: '0.5rem',
                  height: '0.5rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--success-500)',
                  animation: 'pulse 2s infinite'
                }}></div>
                <span style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--success-700)'
                }}>
                  LIVE
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--text-secondary)'
              }}>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </span>
              <button
                onClick={fetchLiveData}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        <div className="content-area">
          {/* System Status */}
          <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
            <div className="card-header">
              <h2 className="card-title">System Status</h2>
            </div>
            <div className="card-content">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                background: 'var(--success-50)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--success-200)'
              }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: 'var(--radius-full)',
                  background: getStatusColor(data.systemStatus),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <Zap size={16} />
                </div>
                <div>
                  <h3 style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--success-700)',
                    margin: 0
                  }}>
                    All Systems Operational
                  </h3>
                  <p style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--success-600)',
                    margin: 0
                  }}>
                    EventPass Pro is running smoothly
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
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
                    <Activity size={24} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      margin: 0,
                      color: 'var(--text-primary)'
                    }}>
                      {data.totalEvents}
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
                      {data.activeEvents}
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Active Events
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
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      margin: 0,
                      color: 'var(--text-primary)'
                    }}>
                      {data.totalCheckIns}
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Total Check-ins
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
                      {data.checkInsLastHour}
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Check-ins/Hour
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Recent Activity</h2>
              <p className="card-subtitle">Live updates from your events</p>
            </div>
            <div className="card-content">
              {data.recentActivity.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--space-8)',
                  color: 'var(--text-secondary)'
                }}>
                  <Clock size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.5 }} />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {data.recentActivity.map((activity) => (
                    <div key={activity.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-3)',
                      padding: 'var(--space-3)',
                      background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--gray-200)'
                    }}>
                      <div style={{
                        color: 'var(--primary-600)',
                        flexShrink: 0
                      }}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          color: 'var(--text-primary)',
                          margin: 0
                        }}>
                          {activity.message}
                        </p>
                        <p style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-secondary)',
                          margin: 0
                        }}>
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Live;