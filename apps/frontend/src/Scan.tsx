import React, { useState } from 'react';
import QrScanner from 'react-qr-scanner';

interface ScannedData {
  text: string;
}

const Scan: React.FC = () => {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const handleScan = (data: ScannedData | null) => {
    if (data) {
      setResult(data.text);
      validateQRCode(data.text);
    }
  };

  const handleError = (err: Error) => {
    setError(err);
  };

  const validateQRCode = async (qrData: string) => {
    try {
      const response = await fetch(`/api/scan/${qrData}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const result = await response.json();
      // Handle successful validation
      console.log('Validation successful:', result);
    } catch (error: any) {
      // Handle validation error
      console.error('Validation error:', error);
      setError(error);
    }
  };

  return (
    <div>
      <h1>Scan QR Code</h1>
      <QrScanner
        delay={300}
        onError={handleError}
        onScan={handleScan}
        style={{ width: '100%' }}
        constraints={{
          audio: false,
          video: { facingMode: 'environment' }
        }}
      />
      {result && <p>Scanned Result: {result}</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
};

export default Scan;
