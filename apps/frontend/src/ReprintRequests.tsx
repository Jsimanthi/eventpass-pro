import React, { useState, useEffect } from 'react';
import {
  Printer,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

interface ReprintRequest {
  id: number;
  invitee_id: number;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  updated_at: string;
  invitee_email?: string;
  event_name?: string;
}

const ReprintRequests: React.FC = () => {
  const [requests, setRequests] = useState<ReprintRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed'>('all');
  const [selectedRequest, setSelectedRequest] = useState<ReprintRequest | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockRequests: ReprintRequest[] = [
        {
          id: 1,
          invitee_id: 123,
          user_id: 'user-456',
          status: 'pending',
          created_at: '2025-10-24T14:30:00Z',
          updated_at: '2025-10-24T14:30:00Z',
          invitee_email: 'john.doe@example.com',
          event_name: 'Tech Conference 2025'
        },
        {
          id: 2,
          invitee_id: 124,
          user_id: 'user-789',
          status: 'approved',
          created_at: '2025-10-24T13:15:00Z',
          updated_at: '2025-10-24T13:45:00Z',
          invitee_email: 'jane.smith@example.com',
          event_name: 'Product Launch Event'
        },
        {
          id: 3,
          invitee_id: 125,
          user_id: 'user-101',
          status: 'completed',
          created_at: '2025-10-24T12:00:00Z',
          updated_at: '2025-10-24T12:30:00Z',
          invitee_email: 'bob.wilson@example.com',
          event_name: 'Summer Music Festival'
        }
      ];
      setRequests(mockRequests);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: number, newStatus: 'approved' | 'rejected' | 'completed') => {
    try {
      // Mock API call
      setRequests(requests.map(req =>
        req.id === requestId
          ? { ...req, status: newStatus, updated_at: new Date().toISOString() }
          : req
      ));
      setShowActionDialog(false);
      setSelectedRequest(null);
    } catch (err) {
      setError('Failed to update request status');
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.invitee_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.event_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'approved':
        return <span className="badge badge-success">Approved</span>;
      case 'rejected':
        return <span className="badge badge-error">Rejected</span>;
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      default:
        return <span className="badge">Unknown</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'approved':
        return <CheckCircle size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      case 'completed':
        return <CheckCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <span>Loading reprint requests...</span>
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
            Reprint Requests
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
                <Printer size={16} color="white" />
              </div>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--primary-700)'
              }}>
                Requests Active
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
              Reprint Requests
            </h1>
          </div>
        </header>

        <div className="content-area">
          {/* Stats Cards */}
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
                    <Printer size={24} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      margin: 0,
                      color: 'var(--text-primary)'
                    }}>
                      {requests.length}
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Total Requests
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
                    <Clock size={24} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      margin: 0,
                      color: 'var(--text-primary)'
                    }}>
                      {requests.filter(r => r.status === 'pending').length}
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Pending
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
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      margin: 0,
                      color: 'var(--text-primary)'
                    }}>
                      {requests.filter(r => r.status === 'completed').length}
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Completed
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
                    <XCircle size={24} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      margin: 0,
                      color: 'var(--text-primary)'
                    }}>
                      {requests.filter(r => r.status === 'rejected').length}
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Rejected
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="card-content">
              <div style={{
                display: 'flex',
                gap: 'var(--space-4)',
                alignItems: 'center',
                flexWrap: 'wrap'
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
                    placeholder="Search by email or event..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: 'var(--space-10)' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="form-input"
                    style={{ minWidth: '120px' }}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <button
                  onClick={fetchRequests}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Requests Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Reprint Requests</h2>
              <p className="card-subtitle">Manage QR code reprint requests from attendees</p>
            </div>
            <div className="card-content">
              {filteredRequests.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--space-12)',
                  color: 'var(--text-secondary)'
                }}>
                  <Printer size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.5 }} />
                  <p>No reprint requests found matching your criteria</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Attendee Email</th>
                        <th>Event</th>
                        <th>Status</th>
                        <th>Requested</th>
                        <th>Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map(request => (
                        <tr key={request.id}>
                          <td style={{ fontWeight: 'var(--font-weight-medium)' }}>
                            #{request.id}
                          </td>
                          <td style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                            {request.invitee_email}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {request.event_name}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              {getStatusIcon(request.status)}
                              {getStatusBadge(request.status)}
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {new Date(request.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {new Date(request.updated_at).toLocaleDateString()}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(request.id, 'approved')}
                                    className="btn btn-sm btn-success"
                                    title="Approve Request"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(request.id, 'rejected')}
                                    className="btn btn-sm btn-error"
                                    title="Reject Request"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </>
                              )}
                              {request.status === 'approved' && (
                                <button
                                  onClick={() => handleStatusUpdate(request.id, 'completed')}
                                  className="btn btn-sm btn-primary"
                                  title="Mark as Completed"
                                >
                                  <Printer size={14} />
                                </button>
                              )}
                            </div>
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

export default ReprintRequests;