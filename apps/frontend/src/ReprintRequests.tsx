import React, { useState } from 'react';
import './ReprintRequests.css';

interface ReprintRequest {
  id: number;
  email: string;
  reason: string;
  status: 'pending' | 'completed';
}

const ReprintRequests: React.FC = () => {
  const [reprintRequests, setReprintRequests] = useState<ReprintRequest[]>([
    { id: 1, email: 'user1@example.com', reason: 'Lost badge', status: 'pending' },
    { id: 2, email: 'user2@example.com', reason: 'Damaged badge', status: 'pending' },
    { id: 3, email: 'user3@example.com', reason: 'Incorrect information', status: 'completed' },
  ]);

  const handleCompleteRequest = (id: number) => {
    setReprintRequests(reprintRequests.map(request =>
      request.id === id ? { ...request, status: 'completed' } : request
    ));
  };

  return (
    <div className="container">
      <h1 className="title">Reprint Requests</h1>
      <div className="card">
        <h2 className="card-title">Pending Requests</h2>
        <ul className="request-list">
          {reprintRequests.filter(request => request.status === 'pending').map(request => (
            <li key={request.id} className="request-item">
              <div>
                <p><strong>Email:</strong> {request.email}</p>
                <p><strong>Reason:</strong> {request.reason}</p>
              </div>
              <button onClick={() => handleCompleteRequest(request.id)}>Complete</button>
            </li>
          ))}
        </ul>
      </div>
      <div className="card">
        <h2 className="card-title">Completed Requests</h2>
        <ul className="request-list">
          {reprintRequests.filter(request => request.status === 'completed').map(request => (
            <li key={request.id} className="request-item completed">
              <div>
                <p><strong>Email:</strong> {request.email}</p>
                <p><strong>Reason:</strong> {request.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReprintRequests;
