import React, { useState, useEffect } from 'react';
import './QueueMonitoring.css';

interface Job {
  id: number;
  type: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

const QueueMonitoring: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([
    { id: 1, type: 'send-email', status: 'completed' },
    { id: 2, type: 'generate-report', status: 'processing' },
    { id: 3, type: 'send-email', status: 'queued' },
  ]);

  useEffect(() => {
    // In a real application, you would fetch the job queue status from the server
    const interval = setInterval(() => {
      // Simulate updating the job status
      setJobs(prevJobs =>
        prevJobs.map(job => {
          if (job.status === 'processing') {
            return { ...job, status: 'completed' };
          } else if (job.status === 'queued') {
            return { ...job, status: 'processing' };
          }
          return job;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <h1 className="title">Job Queue</h1>
      <div className="card">
        <ul className="job-list">
          {jobs.map(job => (
            <li key={job.id} className={`job-item status-${job.status}`}>
              <div>
                <p><strong>Job ID:</strong> {job.id}</p>
                <p><strong>Type:</strong> {job.type}</p>
              </div>
              <p><strong>Status:</strong> {job.status}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default QueueMonitoring;
