import React, { useState } from 'react';
import './UserManagement.css';

interface User {
  id: number;
  email: string;
  name: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    { id: 1, email: 'user1@example.com', name: 'User One' },
    { id: 2, email: 'user2@example.com', name: 'User Two' },
    { id: 3, email: 'user3@example.com', name: 'User Three' },
  ]);

  const handleEditUser = (id: number) => {
    // Logic to edit user will be implemented later
    console.log(`Editing user with id: ${id}`);
  };

  const handleDeleteUser = (id: number) => {
    setUsers(users.filter(user => user.id !== id));
  };

  return (
    <div className="container">
      <h1 className="title">User Management</h1>
      <div className="card">
        <ul className="user-list">
          {users.map(user => (
            <li key={user.id} className="user-item">
              <div>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
              <div>
                <button onClick={() => handleEditUser(user.id)}>Edit</button>
                <button onClick={() => handleDeleteUser(user.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserManagement;
