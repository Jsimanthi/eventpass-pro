import React, { useState, useEffect } from 'react';

interface Event {
  id?: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
}

interface EventFormProps {
  event?: Event;
  onSave: (event: Event) => void;
}

const EventForm: React.FC<EventFormProps> = ({ event, onSave }) => {
  const [formData, setFormData] = useState<Event>(
    event || { name: '', description: '', start_date: '', end_date: '' }
  );

  useEffect(() => {
    if (event) {
      setFormData(event);
    }
  }, [event]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="name"
        placeholder="Event Name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <textarea
        name="description"
        placeholder="Event Description"
        value={formData.description}
        onChange={handleChange}
        required
      />
      <input
        type="datetime-local"
        name="start_date"
        value={formData.start_date}
        onChange={handleChange}
        required
      />
      <input
        type="datetime-local"
        name="end_date"
        value={formData.end_date}
        onChange={handleChange}
        required
      />
      <button type="submit">Save Event</button>
    </form>
  );
};

export default EventForm;
