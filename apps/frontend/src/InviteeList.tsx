import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw,
  QrCode,
  Mail,
  Phone,
  Calendar,
  MapPin
} from 'lucide-react';

interface Invitee {
  id: number;
  email: string;
  status: 'pending' | 'checked_in' | 'expired' | 'denied';
  created_at: string;
  updated_at: string;
  expires_at: string;
  gift_claimed_at?: string;
  qr_code_url?: string;
  hmac_signature?: string;
}

interface InviteeListProps {
  eventId: number;
}

const InviteeList: React.FC<InviteeListProps> = ({ eventId }) => {
  const [invitees, setInvitees] = useState<Invitee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'checked_in' | 'expired' | 'denied'>('all');

  useEffect(() => {
    fetchInvitees();
  }, [eventId]);

  const fetchInvitees = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${eventId}/invitees`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      setInvitees(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/report`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invitees-event-${eventId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError('Failed to export invitees');
      }
    } catch (err) {
      setError('Failed to export invitees');
    }
  };

  const filteredInvitees = invitees.filter(invitee => {
    const matchesSearch = invitee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || invitee.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'checked_in':
        return <span className="badge badge-success">Checked In</span>;
      case 'expired':
        return <span className="badge badge-error">Expired</span>;
      case 'denied':
        return <span className="badge badge-error">Denied</span>;
      default:
        return <span className="badge">Unknown</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} style={{ color: 'var(--warning-600)' }} />;
      case 'checked_in':
        return <CheckCircle size={16} style={{ color: 'var(--success-600)' }} />;
      case 'expired':
        return <XCircle size={16} style={{ color: 'var(--error-600)' }} />;
      case 'denied':
        return <AlertTriangle size={16} style={{ color: 'var(--error-600)' }} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getStats = () => {
    const total = invitees.length;
    const checkedIn = invitees.filter(i => i.status === 'checked_in').length;
    const pending = invitees.filter(i => i.status === 'pending').length;
    const expired = invitees.filter(i => i.status === 'expired').length;
    const checkInRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    return { total, checkedIn, pending, expired, checkInRate };
  };

  const stats = getStats();

  if (error) {
    return (
      <div className="card">
        <div className="card-content">
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-8)',
            color: 'var(--error-color)'
          }}>
            <AlertTriangle size={48} style={{ marginBottom: 'var(--space-4)' }} />
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Error Loading Invitees</h3>
            <p style={{ marginBottom: 'var(--space-4)' }}>{error}</p>
            <button onClick={fetchInvitees} className="btn btn-primary">
              <RefreshCw size={16} style={{ marginRight: 'var(--space-2)' }} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Event Invitees</h2>
        <p className="card-subtitle">Manage attendees for this event</p>
      </div>

      <div className="card-content">
        {/* Stats Cards */}
        <div className="grid grid-cols-5" style={{
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}>
          <div style={{
            padding: 'var(--space-3)',
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--gray-200)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-1)'
            }}>
              {stats.total}
            </div>
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)'
            }}>
              Total
            </div>
          </div>

          <div style={{
            padding: 'var(--space-3)',
            background: 'var(--success-50)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--success-200)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--success-700)',
              marginBottom: 'var(--space-1)'
            }}>
              {stats.checkedIn}
            </div>
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--success-600)'
            }}>
              Checked In
            </div>
          </div>

          <div style={{
            padding: 'var(--space-3)',
            background: 'var(--warning-50)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--warning-200)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--warning-700)',
              marginBottom: 'var(--space-1)'
            }}>
              {stats.pending}
            </div>
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--warning-600)'
            }}>
              Pending
            </div>
          </div>

          <div style={{
            padding: 'var(--space-3)',
            background: 'var(--error-50)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--error-200)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--error-700)',
              marginBottom: 'var(--space-1)'
            }}>
              {stats.expired}
            </div>
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--error-600)'
            }}>
              Expired
            </div>
          </div>

          <div style={{
            padding: 'var(--space-3)',
            background: 'var(--primary-50)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--primary-200)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--primary-700)',
              marginBottom: 'var(--space-1)'
            }}>
              {stats.checkInRate}%
            </div>
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--primary-600)'
            }}>
              Check-in Rate
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: 'var(--space-3)',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)'
            }} />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 'var(--space-10)' }}
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="form-input"
            style={{ minWidth: '120px' }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="checked_in">Checked In</option>
            <option value="expired">Expired</option>
            <option value="denied">Denied</option>
          </select>

          <button
            onClick={handleExport}
            className="btn btn-success"
            disabled={invitees.length === 0}
          >
            <Download size={16} style={{ marginRight: 'var(--space-2)' }} />
            Export CSV
          </button>

          <button
            onClick={fetchInvitees}
            className="btn btn-outline"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Invitees Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div className="spinner" style={{ marginBottom: 'var(--space-4)' }}></div>
            <p>Loading invitees...</p>
          </div>
        ) : filteredInvitees.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-12)',
            color: 'var(--text-secondary)'
          }}>
            <Users size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.5 }} />
            <h3 style={{ marginBottom: 'var(--space-2)' }}>No invitees found</h3>
            <p>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Upload invitees to get started'
              }
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Expires</th>
                  <th>Checked In At</th>
                  <th>QR Code</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvitees.map(invitee => (
                  <tr key={invitee.id}>
                    <td style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <Mail size={14} style={{ color: 'var(--text-secondary)' }} />
                        {invitee.email}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {getStatusIcon(invitee.status)}
                        {getStatusBadge(invitee.status)}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(invitee.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {new Date(invitee.expires_at).toLocaleDateString()}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {invitee.gift_claimed_at
                        ? new Date(invitee.gift_claimed_at).toLocaleString()
                        : 'Not checked in'
                      }
                    </td>
                    <td>
                      {invitee.qr_code_url ? (
                        <button
                          onClick={() => window.open(invitee.qr_code_url, '_blank')}
                          className="btn btn-sm btn-outline"
                          title="View QR Code"
                        >
                          <QrCode size={14} />
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                          Not generated
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteeList;