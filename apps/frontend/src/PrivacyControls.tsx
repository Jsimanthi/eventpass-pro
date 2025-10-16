import React, { useState } from 'react';
import './PrivacyControls.css';

const PrivacyControls: React.FC = () => {
  const [anonymizationLevel, setAnonymizationLevel] = useState('full');
  const [notifications, setNotifications] = useState(true);

  const handleLevelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAnonymizationLevel(event.target.value);
  };

  const handleNotificationsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotifications(event.target.checked);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real application, you would send the privacy settings to the server
    console.log('Privacy settings saved:', { anonymizationLevel, notifications });
  };

  return (
    <div className="container">
      <h1 className="title">Privacy Controls</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Anonymization Level:</label>
            <div>
              <label>
                <input
                  type="radio"
                  value="full"
                  checked={anonymizationLevel === 'full'}
                  onChange={handleLevelChange}
                />
                Full Anonymization
              </label>
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  value="partial"
                  checked={anonymizationLevel === 'partial'}
                  onChange={handleLevelChange}
                />
                Partial Anonymization
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={notifications}
                onChange={handleNotificationsChange}
              />
              Receive notifications about data usage
            </label>
          </div>
          <button type="submit" className="submit-button">Save Settings</button>
        </form>
      </div>
    </div>
  );
};

export default PrivacyControls;
