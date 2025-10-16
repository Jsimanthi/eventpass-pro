import React, { useState, useEffect } from 'react';
import EventForm from './EventForm';
import InviteeList from './InviteeList';

interface Event {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
}

const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

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
        body: JSON.stringify(event)
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
  };

  const handleAddNew = () => {
    setEditingEvent(undefined);
    setShowForm(true);
    setSelectedEventId(null);
  }

  const handleSelectEvent = (eventId: number) => {
    setSelectedEventId(selectedEventId === eventId ? null : eventId);
    setShowForm(false);
    setEditingEvent(undefined);
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h2>Event List</h2>
      <button onClick={handleAddNew}>Add New Event</button>
      {showForm && (
        <EventForm
          event={editingEvent}
          onSave={handleSave}
        />
      )}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.id} onClick={() => handleSelectEvent(event.id)} style={{ cursor: 'pointer' }}>
              <td>{event.id}</td>
              <td>{event.name}</td>
              <td>{event.description}</td>
              <td>{new Date(event.start_date).toLocaleString()}</td>
              <td>{new Date(event.end_date).toLocaleString()}</td>
              <td>
                <button onClick={(e) => { e.stopPropagation(); handleEdit(event); }}>Edit</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedEventId && <InviteeList eventId={selectedEventId} />}
    </div>
  );
};

export default EventList;
