import React, { useState, useEffect } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Trash2,
  User,
  Database,
  FileText,
  Settings
} from 'lucide-react';

interface PrivacySetting {
  id: string;
  category: 'data_retention' | 'data_sharing' | 'analytics' | 'marketing';
  title: string;
  description: string;
  enabled: boolean;
  lastModified: string;
  compliance: 'gdpr' | 'ccpa' | 'both' | 'none';
}

interface DataRequest {
  id: string;
  type: 'access' | 'deletion' | 'portability' | 'correction';
  user_email: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requested_at: string;
  completed_at?: string;
  notes?: string;
}

const PrivacyControls: React.FC = () => {
  const [settings, setSettings] = useState<PrivacySetting[]>([]);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DataRequest | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  useEffect(() => {
    fetchPrivacyData();
  }, []);

  const fetchPrivacyData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockSettings: PrivacySetting[] = [
        {
          id: '1',
          category: 'data_retention',
          title: 'Data Retention Policy',
          description: 'Automatically delete user data after 2 years of inactivity',
          enabled: true,
          lastModified: '2025-10-24T10:00:00Z',
          compliance: 'gdpr'
        },
        {
          id: '2',
          category: 'data_sharing',
          title: 'Third-party Data Sharing',
          description: 'Share anonymized analytics data with partners',
          enabled: false,
          lastModified: '2025-10-24T09:30:00Z',
          compliance: 'both'
        },
        {
          id: '3',
          category: 'analytics',
          title: 'Usage Analytics',
          description: 'Collect anonymous usage statistics to improve service',
          enabled: true,
          lastModified: '2025-10-24T08:15:00Z',
          compliance: 'ccpa'
        },
        {
          id: '4',
          category: 'marketing',
          title: 'Marketing Communications',
          description: 'Send promotional emails and updates',
          enabled: false,
          lastModified: '2025-10-24T07:45:00Z',
          compliance: 'gdpr'
        }
      ];

      const mockRequests: DataRequest[] = [
        {
          id: '1',
          type: 'access',
          user_email: 'john.doe@example.com',
          status: 'completed',
          requested_at: '2025-10-20T14:30:00Z',
          completed_at: '2025-10-21T10:15:00Z',
          notes: 'Data export provided via email'
        },
        {
          id: '2',
          type: 'deletion',
          user_email: 'jane.smith@example.com',
          status: 'processing',
          requested_at: '2025-10-23T09:45:00Z',
          notes: 'GDPR Article 17 request - Right to erasure'
        },
        {
          id: '3',
          type: 'portability',
          user_email: 'bob.wilson@example.com',
          status: 'pending',
          requested_at: '2025-10-24T16:20:00Z'
        }
      ];

      setSettings(mockSettings);
      setDataRequests(mockRequests);
    } catch (error) {
      console.error('Failed to fetch privacy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingToggle = async (settingId: string, enabled: boolean) => {
    try {
      setSettings(settings.map(setting =>
        setting.id === settingId
          ? { ...setting, enabled, lastModified: new Date().toISOString() }
          : setting
      ));
      // In real app, make API call here
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const newStatus = action === 'approve' ? 'completed' : 'rejected';
      setDataRequests(dataRequests.map(request =>
        request.id === requestId
          ? {
              ...request,
              status: newStatus,
              completed_at: new Date().toISOString(),
              notes: action === 'approve' ? 'Request processed successfully' : 'Request denied per policy'
            }
          : request
      ));
      setShowRequestDialog(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to process request:', error);
    }
  };

  const getComplianceBadge = (compliance: string) => {
    const colors = {
      gdpr: 'badge-primary',
      ccpa: 'badge-secondary',
      both: 'badge-success',
      none: 'badge-secondary'
    };
    return <span className={`badge ${colors[compliance as keyof typeof colors]}`}>{compliance.toUpperCase()}</span>;
  };

  const getRequestStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
      case 'processing':
        return <span className="badge badge-success">Processing</span>;
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'rejected':
        return <span className="badge badge-error">Rejected</span>;
      default:
        return <span className="badge">Unknown</span>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'data_retention':
        return <Database size={20} />;
      case 'data_sharing':
        return <User size={20} />;
      case 'analytics':
        return <FileText size={20} />;
      case 'marketing':
        return <Settings size={20} />;
      default:
        return <Shield size={20} />;
    }
  };

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <span>Loading privacy controls...</span>
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
            Privacy Controls
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
                <Shield size={16} color="white" />
              </div>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--primary-700)'
              }}>
                Privacy Active
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
              Privacy Controls
            </h1>
          </div>
        </header>

        <div className="content-area">
          {/* Privacy Overview */}
          <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
            <div className="card-header">
              <h2 className="card-title">Privacy Overview</h2>
              <p className="card-subtitle">GDPR and CCPA compliance management</p>
            </div>
            <div className="card-content">
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-6)'
              }}>
                <div style={{
                  padding: 'var(--space-4)',
                  background: 'var(--success-50)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--success-200)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--success-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <CheckCircle size={20} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        margin: 0,
                        color: 'var(--success-700)'
                      }}>
                        {dataRequests.filter(r => r.status === 'completed').length}
                      </p>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--success-600)',
                        margin: 0
                      }}>
                        Requests Completed
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: 'var(--space-4)',
                  background: 'var(--warning-50)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--warning-200)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--warning-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        margin: 0,
                        color: 'var(--warning-700)'
                      }}>
                        {dataRequests.filter(r => r.status === 'pending' || r.status === 'processing').length}
                      </p>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--warning-600)',
                        margin: 0
                      }}>
                        Pending Requests
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{
                  padding: 'var(--space-4)',
                  background: 'var(--primary-50)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--primary-200)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div style={{
                      width: '3rem',
                      height: '3rem',
                      borderRadius: 'var(--radius-lg)',
                      background: 'var(--primary-500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <Shield size={20} />
                    </div>
                    <div>
                      <p style={{
                        fontSize: 'var(--font-size-2xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        margin: 0,
                        color: 'var(--primary-700)'
                      }}>
                        {settings.filter(s => s.enabled).length}
                      </p>
                      <p style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--primary-600)',
                        margin: 0
                      }}>
                        Privacy Settings
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="card" style={{ marginBottom: 'var(--space-8)' }}>
            <div className="card-header">
              <h2 className="card-title">Privacy Settings</h2>
              <p className="card-subtitle">Configure data handling and compliance policies</p>
            </div>
            <div className="card-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {settings.map(setting => (
                  <div key={setting.id} style={{
                    padding: 'var(--space-4)',
                    border: '1px solid var(--gray-200)',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-primary)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                          <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: 'var(--radius-lg)',
                            background: setting.enabled ? 'var(--success-100)' : 'var(--gray-100)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: setting.enabled ? 'var(--success-600)' : 'var(--gray-500)'
                          }}>
                            {getCategoryIcon(setting.category)}
                          </div>
                          <div>
                            <h3 style={{
                              fontSize: 'var(--font-size-lg)',
                              fontWeight: 'var(--font-weight-semibold)',
                              margin: 0,
                              color: 'var(--text-primary)'
                            }}>
                              {setting.title}
                            </h3>
                            {getComplianceBadge(setting.compliance)}
                          </div>
                        </div>
                        <p style={{
                          color: 'var(--text-secondary)',
                          margin: 0,
                          marginBottom: 'var(--space-2)'
                        }}>
                          {setting.description}
                        </p>
                        <p style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-muted)',
                          margin: 0
                        }}>
                          Last modified: {new Date(setting.lastModified).toLocaleDateString()}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {setting.enabled ? (
                          <Eye size={16} style={{ color: 'var(--success-600)' }} />
                        ) : (
                          <EyeOff size={16} style={{ color: 'var(--gray-500)' }} />
                        )}
                        <button
                          onClick={() => handleSettingToggle(setting.id, !setting.enabled)}
                          className={`btn ${setting.enabled ? 'btn-success' : 'btn-outline'}`}
                          style={{ minWidth: '80px' }}
                        >
                          {setting.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Data Subject Requests */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Data Subject Requests</h2>
              <p className="card-subtitle">Manage GDPR and CCPA data requests</p>
            </div>
            <div className="card-content">
              {dataRequests.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--space-12)',
                  color: 'var(--text-secondary)'
                }}>
                  <Shield size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.5 }} />
                  <p>No data requests found</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>User Email</th>
                        <th>Status</th>
                        <th>Requested</th>
                        <th>Completed</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataRequests.map(request => (
                        <tr key={request.id}>
                          <td style={{ fontWeight: 'var(--font-weight-medium)' }}>
                            #{request.id}
                          </td>
                          <td style={{ textTransform: 'capitalize' }}>
                            {request.type}
                          </td>
                          <td style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                            {request.user_email}
                          </td>
                          <td>
                            {getRequestStatusBadge(request.status)}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {new Date(request.requested_at).toLocaleDateString()}
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {request.completed_at
                              ? new Date(request.completed_at).toLocaleDateString()
                              : 'N/A'
                            }
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                              {request.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleRequestAction(request.id, 'approve')}
                                    className="btn btn-sm btn-success"
                                    title="Approve Request"
                                  >
                                    <CheckCircle size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleRequestAction(request.id, 'reject')}
                                    className="btn btn-sm btn-error"
                                    title="Reject Request"
                                  >
                                    <XCircle size={14} />
                                  </button>
                                </>
                              )}
                              {request.status === 'completed' && (
                                <button
                                  className="btn btn-sm btn-outline"
                                  title="Download Data"
                                >
                                  <Download size={14} />
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

export default PrivacyControls;