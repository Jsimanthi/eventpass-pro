import React, { useState } from 'react';
import styles from './UserManagement.module.css';

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
      <h1 className="card-title">User Management</h1>
      <div className="card">
        <ul className={styles.userList}>
          {users.map(user => (
            <li key={user.id} className={styles.userItem}>
              <div>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
              <div>
                <button onClick={() => handleEditUser(user.id)} className="btn btn-outline btn-sm">Edit</button>
                <button onClick={() => handleDeleteUser(user.id)} className="btn btn-error btn-sm">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UserManagement;
