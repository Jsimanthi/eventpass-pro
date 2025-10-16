console.log('Worker started');

const processJob = (job: any) => {
  console.log(`Processing job: ${JSON.stringify(job)}`);
  // In a real application, you would have logic to process the job
};

// In a real application, you would have a queue to listen for jobs
// For now, we'll just simulate a job being added

const job = {
  type: 'send-email',
  data: {
    to: 'user@example.com',
    subject: 'Welcome!',
    body: 'Thanks for signing up!'
  }
};

processJob(job);
