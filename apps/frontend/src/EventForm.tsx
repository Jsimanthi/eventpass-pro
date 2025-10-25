import React, { useState } from 'react';
import { Calendar, MapPin, Save, X, Plus } from 'lucide-react';

interface Event {
  id?: number;
  name: string;
  date: string;
  location: string;
}

interface EventFormProps {
  event?: Event | null;
  onSave: (event: Event) => void;
  onCancel?: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Event>({
    name: event?.name || '',
    date: event?.date || '',
    location: event?.location || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Event>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Event> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    }

    if (!formData.date) {
      newErrors.date = 'Event date is required';
    } else {
      const selectedDate = new Date(formData.date);
      const now = new Date();
      if (selectedDate < now) {
        newErrors.date = 'Event date cannot be in the past';
      }
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Event location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...event,
        ...formData
      });
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name as keyof Event]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">
          {event ? 'Edit Event' : 'Create New Event'}
        </h2>
        <p className="card-subtitle">
          {event ? 'Update event details' : 'Fill in the details for your new event'}
        </p>
      </div>

      <div className="card-content">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Event Name *</label>
            <input
              type="text"
              name="name"
              className={`form-input ${errors.name ? 'form-group--error' : ''}`}
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter event name"
              required
            />
            {errors.name && (
              <div className="form-error">
                {errors.name}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Event Date & Time *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="datetime-local"
                name="date"
                className={`form-input ${errors.date ? 'form-group--error' : ''}`}
                value={formatDateForInput(formData.date)}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
              <Calendar
                size={16}
                style={{
                  position: 'absolute',
                  right: 'var(--space-3)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                  pointerEvents: 'none'
                }}
              />
            </div>
            {errors.date && (
              <div className="form-error">
                {errors.date}
              </div>
            )}
            <div className="form-help">
              Select the date and time when your event will take place
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="location"
                className={`form-input ${errors.location ? 'form-group--error' : ''}`}
                value={formData.location}
                onChange={handleChange}
                placeholder="Enter event location"
                required
              />
              <MapPin
                size={16}
                style={{
                  position: 'absolute',
                  right: 'var(--space-3)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                  pointerEvents: 'none'
                }}
              />
            </div>
            {errors.location && (
              <div className="form-error">
                {errors.location}
              </div>
            )}
            <div className="form-help">
              Venue name, address, or virtual meeting link
            </div>
          </div>

          <div className="card-footer" style={{
            display: 'flex',
            gap: 'var(--space-3)',
            justifyContent: 'flex-end',
            borderTop: '1px solid var(--gray-200)',
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-4)'
          }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-outline"
                disabled={loading}
              >
                <X size={16} style={{ marginRight: 'var(--space-2)' }} />
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '1rem', height: '1rem', marginRight: 'var(--space-2)' }}></div>
                  {event ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {event ? <Save size={16} /> : <Plus size={16} />}
                  <span style={{ marginLeft: 'var(--space-2)' }}>
                    {event ? 'Update Event' : 'Create Event'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventForm;