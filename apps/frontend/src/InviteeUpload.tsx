import React, { useState } from 'react';

interface InviteeUploadProps {
  eventId: number;
}

declare global {
  interface ImportMeta {
    env: {
      VITE_API_URL?: string;
    };
  }
}

const InviteeUpload: React.FC<InviteeUploadProps> = ({ eventId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${baseUrl}/api/events/${eventId}/invitees`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        const responseBody = await response.text();
        setMessage(responseBody);
      } else {
        const errorText = await response.text();
        setMessage(`Error: ${errorText}`);
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div>
      <h3>Upload Invitees</h3>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default InviteeUpload;
