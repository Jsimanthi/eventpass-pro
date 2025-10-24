import React, { useState, useEffect } from 'react';
import EventForm from './EventForm';
import InviteeList from './InviteeList';
import InviteeUpload from './InviteeUpload';

interface Event {
  id?: number;
  name: string;
  date: string;
  location: string;
}

const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const fetchEvents = async () => {
    try {
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
      setEditingEvent(undefined);
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
    setEditingEvent(undefined);
    setShowForm(true);
    setSelectedEventId(null);
    setShowUpload(false);
  }

  const handleSelectEvent = (eventId: number) => {
    setSelectedEventId(selectedEventId === eventId ? null : eventId);
    setShowForm(false);
    setEditingEvent(undefined);
    setShowUpload(false);
  };
  
  const handleShowUpload = () => {
    setShowUpload(!showUpload);
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Event List</h2>
        <p className="card-subtitle">Manage your events and invitees</p>
      </div>
      <div className="card-content">
        <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
          <button onClick={handleAddNew} className="btn btn-primary">
            Add New Event
          </button>
          {selectedEventId && (
            <button onClick={handleShowUpload} className="btn btn-secondary">
              {showUpload ? 'Hide' : 'Show'} Upload Invitees
            </button>
          )}
        </div>

        {showForm && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <EventForm
              event={editingEvent}
              onSave={handleSave}
            />
          </div>
        )}

        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-secondary)' }}>
            <p>No events found. Create your first event to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              background: 'var(--bg-primary)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <thead style={{ background: 'var(--gray-50)' }}>
                <tr>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    borderBottom: '2px solid var(--gray-200)'
                  }}>ID</th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    borderBottom: '2px solid var(--gray-200)'
                  }}>Name</th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    borderBottom: '2px solid var(--gray-200)'
                  }}>Location</th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    borderBottom: '2px solid var(--gray-200)'
                  }}>Date</th>
                  <th style={{
                    padding: 'var(--space-4)',
                    textAlign: 'left',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)',
                    borderBottom: '2px solid var(--gray-200)'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <tr key={event.id}
                      onClick={() => event.id && handleSelectEvent(event.id)}
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color var(--transition-base)',
                        borderBottom: '1px solid var(--gray-200)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>{event.id}</td>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 'var(--font-weight-medium)', color: 'var(--text-primary)' }}>{event.name}</td>
                    <td style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>{event.location}</td>
                    <td style={{ padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>{new Date(event.date).toLocaleString()}</td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(event); }}
                          className="btn btn-sm btn-outline"
                          style={{ fontSize: 'var(--font-size-xs)' }}>
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); event.id && handleDelete(event.id); }}
                          className="btn btn-sm btn-error"
                          style={{ fontSize: 'var(--font-size-xs)' }}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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
