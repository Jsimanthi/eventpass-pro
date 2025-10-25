import React, { useState, useEffect } from 'react';
import EventForm from './EventForm.tsx';
import InviteeList from './InviteeList.tsx';
import InviteeUpload from './InviteeUpload.tsx';
import {
  Calendar,
  MapPin,
  Users,
  Edit,
  Trash2,
  Plus,
  Upload,
  Eye,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

interface Event {
  id?: number;
  name: string;
  date: string;
  location: string;
  total_invitees?: number;
  checked_in_count?: number;
}

const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'past'>('all');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();
      setEvents(data);
    } catch (error: any) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSave = async (event: Event) => {
    const method = event.id ? 'PUT' : 'POST';
    const url = event.id ? `/api/events/${event.id}` : '/api/events';

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          Name: event.name,
          Date: event.date,
          Location: event.location
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      fetchEvents(); // Refetch events after saving
      setShowForm(false);
      setEditingEvent(null);
    } catch (error: any) {
      setError(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await fetch(`/api/events/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        fetchEvents(); // Refetch events after deleting
      } catch (error: any) {
        setError(error);
      }
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
    setSelectedEventId(null);
    setShowUpload(false);
  };

  const handleAddNew = () => {
    setEditingEvent(null);
    setShowForm(true);
    setSelectedEventId(null);
    setShowUpload(false);
  };

  const handleSelectEvent = (eventId: number) => {
    setSelectedEventId(selectedEventId === eventId ? null : eventId);
    setShowForm(false);
    setEditingEvent(null);
    setShowUpload(false);
  };

  const handleShowUpload = () => {
    setShowUpload(!showUpload);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());

    const eventDate = new Date(event.date);
    const now = new Date();
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'upcoming' && eventDate >= now) ||
      (filterStatus === 'past' && eventDate < now);

    return matchesSearch && matchesFilter;
  });

  if (error) {
    return (
      <div className="card">
        <div className="card-content">
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-8)',
            color: 'var(--error-color)'
          }}>
            <div style={{ fontSize: 'var(--font-size-4xl)', marginBottom: 'var(--space-4)' }}>⚠️</div>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Error Loading Events</h3>
            <p style={{ marginBottom: 'var(--space-4)' }}>{error.message}</p>
            <button onClick={fetchEvents} className="btn btn-primary">
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
        <h2 className="card-title">Event Management</h2>
        <p className="card-subtitle">Create and manage your events and invitees</p>
      </div>

      <div className="card-content">
        {/* Action Bar */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <button onClick={handleAddNew} className="btn btn-primary">
            <Plus size={16} style={{ marginRight: 'var(--space-2)' }} />
            Add New Event
          </button>

          {selectedEventId && (
            <>
              <button onClick={handleShowUpload} className="btn btn-secondary">
                <Upload size={16} style={{ marginRight: 'var(--space-2)' }} />
                {showUpload ? 'Hide' : 'Show'} Upload
              </button>

              <button
                onClick={() => handleSelectEvent(selectedEventId)}
                className="btn btn-outline"
              >
                <Eye size={16} style={{ marginRight: 'var(--space-2)' }} />
                View Invitees
              </button>
            </>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{
                position: 'absolute',
                left: 'var(--space-3)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: 'var(--space-10)', minWidth: '200px' }}
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="form-input"
              style={{ minWidth: '120px' }}
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past Events</option>
            </select>

            <button
              onClick={fetchEvents}
              className="btn btn-outline"
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Event Form */}
        {showForm && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <EventForm
              event={editingEvent}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingEvent(null);
              }}
            />
          </div>
        )}

        {/* Events List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div className="spinner" style={{ marginBottom: 'var(--space-4)' }}></div>
            <p>Loading events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-12)',
            color: 'var(--text-secondary)'
          }}>
            <Calendar size={48} style={{ marginBottom: 'var(--space-4)', opacity: 0.5 }} />
            <h3 style={{ marginBottom: 'var(--space-2)' }}>
              {searchTerm || filterStatus !== 'all' ? 'No events found' : 'No events yet'}
            </h3>
            <p style={{ marginBottom: 'var(--space-4)' }}>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Create your first event to get started'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button onClick={handleAddNew} className="btn btn-primary">
                <Plus size={16} style={{ marginRight: 'var(--space-2)' }} />
                Create Event
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Invitees</th>
                  <th>Checked In</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map(event => {
                  const isValidDate = event.date && !isNaN(new Date(event.date).getTime());
                  const formattedDate = isValidDate ? new Date(event.date).toLocaleString() : 'Invalid Date';
                  const isUpcoming = isValidDate && new Date(event.date) >= new Date();

                  return (
                    <tr
                      key={event.id}
                      onClick={() => event.id && handleSelectEvent(event.id)}
                      className="table-row"
                      style={{
                        cursor: 'pointer',
                        backgroundColor: selectedEventId === event.id ? 'var(--primary-50)' : undefined
                      }}
                    >
                      <td style={{ fontWeight: 'var(--font-weight-medium)' }}>
                        #{event.id}
                      </td>
                      <td style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>
                        {event.name}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <MapPin size={14} />
                          {event.location}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <Calendar size={14} />
                          {formattedDate}
                          {isUpcoming && (
                            <span className="badge badge-success" style={{ fontSize: 'var(--font-size-xs)' }}>
                              Upcoming
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'var(--font-weight-medium)' }}>
                        {event.total_invitees || 0}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-success">
                          {event.checked_in_count || 0}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(event); }}
                            className="btn btn-sm btn-outline"
                            title="Edit Event"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); event.id && handleDelete(event.id); }}
                            className="btn btn-sm btn-error"
                            title="Delete Event"
                          >
                            <Trash2 size={14} />
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

        {/* Selected Event Details */}
        {selectedEventId && (
          <div style={{ marginTop: 'var(--space-6)' }}>
            {showUpload && (
              <div style={{ marginBottom: 'var(--space-6)' }}>
                <InviteeUpload eventId={selectedEventId} />
              </div>
            )}
            <InviteeList eventId={selectedEventId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default EventList;