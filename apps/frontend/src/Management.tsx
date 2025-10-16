import React, { useState, useEffect } from 'react';
import EventList from './EventList';

const Management: React.FC = () => {
  const [checkIns, setCheckIns] = useState<any[]>([]);

  useEffect(() => {
    // In a real application, you would fetch this data from an API
    const mockCheckIns = [
      { email: 'user1@example.com', gift_claimed_at: new Date().toISOString() },
      { email: 'user2@example.com', gift_claimed_at: new Date().toISOString() },
      { email: 'user3@example.com', gift_claimed_at: new Date().toISOString() },
    ];
    setCheckIns(mockCheckIns);
  }, []);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + ["Email", "Gift Claimed At"].join(",") + "\n"
      + checkIns.map(e => `"${e.email}","${e.gift_claimed_at}"`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "check-ins.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div>
      <h1>Management</h1>
      <button onClick={handleExport}>Export to CSV</button>
      <EventList />
    </div>
  );
};

export default Management;
