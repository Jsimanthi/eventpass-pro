import React, { useState, useEffect } from 'react';
import {
  Clock,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  RefreshCw,
  BarChart3,
  Zap
} from 'lucide-react';

interface QueueItem {
  id: string;
  type: 'checkin' | 'registration' | 'reprint' | 'support';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  estimated_completion?: string;
  user_email?: string;
  event_name?: string;
}

interface QueueStats {
  totalQueued: number;
  processing: number;
  completedToday: number;
  averageWaitTime: number;
  systemLoad: number;
}

const QueueMonitoring: React.FC = () => {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    totalQueued: 0,
    processing: 0,
    completedToday: 0,
    averageWaitTime: 0,
    systemLoad: 0
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'checkin' | 'registration' | 'reprint' | 'support'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'queued' | 'processing' | 'completed' | 'failed'>('all');

  useEffect(() => {
    fetchQueueData();
    const interval = setInterval(fetchQueueData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQueueData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockQueueItems: QueueItem[] = [
        {
          id: '1',
          type: 'checkin',
          status: 'processing',
          priority: 'high',
          created_at: new Date(Date.now() - 300000).toISOString(),
          estimated_completion: new Date(Date.now() + 120000).toISOString(),
          user_email: 'john.doe@example.com',
          event_name: 'Tech Conference 2025'
        },
        {
          id: '2',
          type: 'registration',
          status: 'queued',
          priority: 'medium',
          created_at: new Date(Date.now() - 180000).toISOString(),
          user_email: 'jane.smith@example.com',
          event_name: 'Product Launch Event'
        },
        {
          id: '3',
          type: 'reprint',
          status: 'completed',
          priority: 'low',
          created_at: new Date(Date.now() - 600000).toISOString(),
          user_email: 'bob.wilson@example.com',
          event_name: 'Summer Music Festival'
        },
        {
          id: '4',
          type: 'support',
          status: 'queued',
          priority: 'urgent',
          created_at: new Date(Date.now() - 120000).toISOString(),
          user_email: 'support@example.com'
        }
      ];

      setQueueItems(mockQueueItems);

      // Calculate stats
      const queued = mockQueueItems.filter(item => item.status === 'queued').length;
      const processing = mockQueueItems.filter(item => item.status === 'processing').length;
      const completed = mockQueueItems.filter(item => item.status === 'completed').length;

      setStats({
        totalQueued: queued,
        processing,
        completedToday: completed,
        averageWaitTime: Math.floor(Math.random() * 300) + 60, // Mock: 1-5 minutes
        systemLoad: Math.floor(Math.random() * 100) + 20 // Mock: 20-100%
      });
    } catch (error) {
      console.error('Failed to fetch queue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = queueItems.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued':
        return <span className="badge badge-warning">Queued</span>;
      case 'processing':
        return <span className="badge badge-success">Processing</span>;
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'failed':
        return <span className="badge badge-error">Failed</span>;
      default:
        return <span className="badge">Unknown</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'badge-secondary',
      medium: 'badge-warning',
      high: 'badge-error',
      urgent: 'badge-error'
    };
    return <span className={`badge ${colors[priority as keyof typeof colors]}`}>{priority.toUpperCase()}</span>;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'checkin':
        return <CheckCircle size={16} />;
      case 'registration':
        return <Users size={16} />;
      case 'reprint':
        return <Activity size={16} />;
      case 'support':
        return <AlertTriangle size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  const getSystemLoadColor = (load: number) => {
    if (load < 50) return 'var(--success-500)';
    if (load < 80) return 'var(--warning-500)';
    return 'var(--error-500)';
  };

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <span>Loading queue monitoring...</span>
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
            Queue Monitoring
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
                <Clock size={16} color="white" />
              </div>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--primary-700)'
              }}>
                Queue Active
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
            <h1 style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              Queue Monitoring
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-2) var(--space-3)',
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

              <button
                onClick={fetchQueueData}
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
          {/* System Overview */}
          <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
            <div className="card-header">
              <h2 className="card-title">System Overview</h2>
              <p className="card-subtitle">Real-time queue performance and system health</p>
            </div>
            <div className="card-content">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-6)'
              }}>
                <div style={{
                  padding: 'var(--space-4)',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--gray-200)'
                }}>
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
                      <Clock size={20} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        margin: 0,
                        color: 'var(--text-primary)'
                      }}>
                        {stats.totalQueued}
                      </p>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)',
                        margin: 0
                      }}>
                        Items Queued
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: 'var(--space-4)',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--gray-200)'
                }}>
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
                      <Activity size={20} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        margin: 0,
                        color: 'var(--text-primary)'
                      }}>
                        {stats.processing}
                      </p>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)',
                        margin: 0
                      }}>
                        Processing
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: 'var(--space-4)',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--gray-200)'
                }}>
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
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        margin: 0,
                        color: 'var(--text-primary)'
                      }}>
                        {stats.averageWaitTime}s
                      </p>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)',
                        margin: 0
                      }}>
                        Avg Wait Time
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: 'var(--space-4)',
                  background: 'var(--gray-50)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--gray-200)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: 'var(--radius-lg)',
                      background: `linear-gradient(135deg, ${getSystemLoadColor(stats.systemLoad)} 0%, ${getSystemLoadColor(stats.systemLoad)} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <Zap size={20} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        margin: 0,
                        color: 'var(--text-primary)'
                      }}>
                        {stats.systemLoad}%
                      </p>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-secondary)',
                        margin: 0
                      }}>
                        System Load
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="card-content">
              <div style={{
                display: 'flex',
                gap: 'var(--space-4)',
                alignItems: 'center',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                    Type:
                  </span>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="form-input"
                    style={{ minWidth: '120px' }}
                  >
                    <option value="all">All Types</option>
                    <option value="checkin">Check-in</option>
                    <option value="registration">Registration</option>
                    <option value="reprint">Reprint</option>
                    <option value="support">Support</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                    Status:
                  </span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="form-input"
                    style={{ minWidth: '120px' }}
                  >
                    <option value="all">All Status</option>
                    <option value="queued">Queued</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Queue Items */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Queue Items</h2>
              <p className="card-subtitle">Monitor and manage queued operations</p>
            </div>
            <div className="card-content">
              {filteredItems.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--space-12)',
                  color: 'var(--text-secondary)'
                }}>
                  <Clock size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.5 }} />
                  <p>No queue items found matching your filters</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>User</th>
                        <th>Event</th>
                        <th>Status</th>
                        <th>Priority</th>
                        <th>Created</th>
                        <th>ETA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map(item => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 'var(--font-weight-medium)' }}>
                            #{item.id}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              {getTypeIcon(item.type)}
                              <span style={{ textTransform: 'capitalize' }}>{item.type}</span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                            {item.user_email}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {item.event_name || 'N/A'}
                          </td>
                          <td>
                            {getStatusBadge(item.status)}
                          </td>
                          <td>
                            {getPriorityBadge(item.priority)}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {new Date(item.created_at).toLocaleTimeString()}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {item.estimated_completion
                              ? new Date(item.estimated_completion).toLocaleTimeString()
                              : 'N/A'
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueMonitoring;