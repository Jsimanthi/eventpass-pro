import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Edit,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  anonymized_at?: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'anonymized'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAnonymizeDialog, setShowAnonymizeDialog] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Note: This would need a backend endpoint to list users
      // For now, showing mock data
      const mockUsers: User[] = [
        {
          id: 'a28d3063-6fca-4f1a-a483-dbba66589003',
          email: 'user@example.com',
          created_at: '2025-10-24T18:54:05.510119Z',
          updated_at: '2025-10-24T18:54:05.510119Z'
        },
        {
          id: 'b38d3063-6fca-4f1a-a483-dbba66589004',
          email: 'admin@example.com',
          created_at: '2025-10-24T18:50:00.000000Z',
          updated_at: '2025-10-24T18:50:00.000000Z'
        }
      ];
      setUsers(mockUsers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymizeUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/anonymize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (response.ok) {
        setUsers(users.map(user =>
          user.id === userId
            ? { ...user, anonymized_at: new Date().toISOString() }
            : user
        ));
        setShowAnonymizeDialog(false);
        setSelectedUser(null);
      } else {
        setError('Failed to anonymize user');
      }
    } catch (err) {
      setError('Failed to anonymize user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'active' && !user.anonymized_at) ||
      (filterStatus === 'anonymized' && user.anonymized_at);
    return matchesSearch && matchesFilter;
  });

  const getUserStatus = (user: User) => {
    if (user.anonymized_at) return 'anonymized';
    if (user.deleted_at) return 'deleted';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="badge badge-success">Active</span>;
      case 'anonymized':
        return <span className="badge badge-warning">Anonymized</span>;
      case 'deleted':
        return <span className="badge badge-error">Deleted</span>;
      default:
        return <span className="badge">Unknown</span>;
    }
  };

  if (loading) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <span>Loading user management...</span>
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
            User Management
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
                <Users size={16} color="white" />
              </div>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--primary-700)'
              }}>
                Users Active
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
              User Management
            </h1>
          </div>
        </header>

        <div className="content-area">
          {/* Stats Cards */}
          <div className="grid grid-cols-3" style={{
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
                    <Users size={24} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      margin: 0,
                      color: 'var(--text-primary)'
                    }}>
                      {users.length}
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Total Users
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
                      {users.filter(u => !u.anonymized_at).length}
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Active Users
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
                    <Shield size={24} />
                  </div>
                  <div>
                    <p style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      margin: 0,
                      color: 'var(--text-primary)'
                    }}>
                      {users.filter(u => u.anonymized_at).length}
                    </p>
                    <p style={{
                      color: 'var(--text-secondary)',
                      margin: 0,
                      fontSize: 'var(--font-size-sm)'
                    }}>
                      Anonymized
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
                    placeholder="Search users by email..."
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
                    <option value="all">All Users</option>
                    <option value="active">Active</option>
                    <option value="anonymized">Anonymized</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Users</h2>
              <p className="card-subtitle">Manage user accounts and privacy settings</p>
            </div>
            <div className="card-content">
              {filteredUsers.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--space-12)',
                  color: 'var(--text-secondary)'
                }}>
                  <Users size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.5 }} />
                  <p>No users found matching your criteria</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Last Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => {
                        const status = getUserStatus(user);
                        return (
                          <tr key={user.id}>
                            <td style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                              {user.email}
                            </td>
                            <td>
                              {getStatusBadge(status)}
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>
                              {new Date(user.updated_at).toLocaleDateString()}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                {!user.anonymized_at && (
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setShowAnonymizeDialog(true);
                                    }}
                                    className="btn btn-sm btn-outline"
                                    title="Anonymize User"
                                  >
                                    <Shield size={14} />
                                  </button>
                                )}
                                <button
                                  className="btn btn-sm btn-ghost"
                                  title="More Actions"
                                >
                                  <MoreVertical size={14} />
                                </button>
                              </div>
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

      {/* Anonymize Dialog */}
      {showAnonymizeDialog && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowAnonymizeDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Anonymize User</h3>
              <button
                className="modal-close"
                onClick={() => setShowAnonymizeDialog(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div style={{
                padding: 'var(--space-4)',
                background: 'var(--warning-50)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--warning-200)',
                marginBottom: 'var(--space-4)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Shield size={20} style={{ color: 'var(--warning-600)' }} />
                  <span style={{
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--warning-700)'
                  }}>
                    GDPR Compliance Action
                  </span>
                </div>
              </div>

              <p style={{ marginBottom: 'var(--space-4)' }}>
                Are you sure you want to anonymize <strong>{selectedUser.email}</strong>?
              </p>

              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                <p>This action will:</p>
                <ul style={{ marginLeft: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                  <li>Permanently remove the user's email address</li>
                  <li>Replace personal data with anonymous identifiers</li>
                  <li>Comply with GDPR right to erasure</li>
                  <li>Cannot be undone</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setShowAnonymizeDialog(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-warning"
                onClick={() => handleAnonymizeUser(selectedUser.id)}
              >
                <Shield size={16} style={{ marginRight: 'var(--space-2)' }} />
                Anonymize User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;