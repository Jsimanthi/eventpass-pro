import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CameraOff,
  Flashlight,
  FlashlightOff,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Smartphone
} from 'lucide-react';

interface ScanResult {
  success: boolean;
  message: string;
  invitee?: {
    id: number;
    email: string;
    event_name: string;
    status: string;
  };
}

const Scan: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    checkCameraSupport();
    return () => {
      stopCamera();
    };
  }, []);

  const checkCameraSupport = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideoInput = devices.some(device => device.kind === 'videoinput');
      setHasCamera(hasVideoInput);
    } catch (error) {
      console.error('Error checking camera support:', error);
      setHasCamera(false);
    }
  };

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        setScanResult(null);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setScanResult({
        success: false,
        message: 'Failed to access camera. Please check permissions.'
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const toggleFlash = async () => {
    if (!streamRef.current) return;

    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities() as any;

      if (capabilities.torch) {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      }
    } catch (error) {
      console.error('Error toggling flash:', error);
    }
  };

  const switchCamera = () => {
    setFacingMode(facingMode === 'environment' ? 'user' : 'environment');
    stopCamera();
    setTimeout(startCamera, 100);
  };

  const simulateQRScan = async (qrCode: string) => {
    try {
      const response = await fetch(`/api/scan/${encodeURIComponent(qrCode)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });

      if (response.ok) {
        const result = await response.json();
        setScanResult({
          success: true,
          message: `Successfully checked in ${result.email} for event!`,
          invitee: result
        });
      } else {
        const errorData = await response.json();
        setScanResult({
          success: false,
          message: errorData.error || 'Invalid QR code or already checked in'
        });
      }
    } catch (error) {
      setScanResult({
        success: false,
        message: 'Network error. Please try again.'
      });
    }
  };

  const handleManualScan = () => {
    // Simulate scanning a QR code for demo purposes
    const mockQRCodes = [
      'invitee_123_signature',
      'invitee_456_signature',
      'invalid_qr_code'
    ];
    const randomQR = mockQRCodes[Math.floor(Math.random() * mockQRCodes.length)];
    simulateQRScan(randomQR);
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{
          padding: 'var(--space-6)',
          borderBottom: '1px solid var(--gray-200)',
          background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%)'
        }}>
          <h2 style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--primary-700)',
            marginBottom: 'var(--space-1)'
          }}>
            EventPass Pro
          </h2>
          <p style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            margin: 0
          }}>
            QR Scanner
          </p>
        </div>

        <nav style={{ padding: 'var(--space-4)' }}>
          <div style={{
            padding: 'var(--space-3)',
            background: 'var(--primary-50)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-full)',
                background: 'var(--primary-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Smartphone size={16} color="white" />
              </div>
              <span style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--primary-700)'
              }}>
                Scanner Active
              </span>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header style={{
          background: 'var(--bg-primary)',
          borderBottom: '1px solid var(--gray-200)',
          padding: 'var(--space-4) var(--space-6)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <h1 style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--text-primary)',
              margin: 0
            }}>
              QR Code Scanner
            </h1>
          </div>
        </header>

        <div className="content-area">
          {/* Scanner Interface */}
          <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="card-header">
              <h2 className="card-title">Live Scanner</h2>
              <p className="card-subtitle">Scan QR codes to check in attendees</p>
            </div>
            <div className="card-content">
              {!hasCamera ? (
                <div style={{
                  textAlign: 'center',
                  padding: 'var(--space-8)',
                  background: 'var(--warning-50)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--warning-200)'
                }}>
                  <CameraOff size={48} style={{ color: 'var(--warning-500)', marginBottom: 'var(--space-4)' }} />
                  <h3 style={{ color: 'var(--warning-700)', marginBottom: 'var(--space-2)' }}>
                    Camera Not Available
                  </h3>
                  <p style={{ color: 'var(--warning-600)' }}>
                    Your device doesn't have a camera or camera access is denied.
                  </p>
                </div>
              ) : (
                <div>
                  {/* Camera View */}
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '500px',
                    margin: '0 auto var(--space-6)',
                    borderRadius: 'var(--radius-xl)',
                    overflow: 'hidden',
                    background: 'var(--gray-900)',
                    aspectRatio: '4/3'
                  }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: isScanning ? 'block' : 'none'
                      }}
                    />

                    {!isScanning && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--gray-400)'
                      }}>
                        <Camera size={48} style={{ marginBottom: 'var(--space-4)' }} />
                        <p>Camera is off</p>
                      </div>
                    )}

                    {/* Scanning Overlay */}
                    {isScanning && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        border: '2px solid var(--primary-500)',
                        borderRadius: 'var(--radius-xl)',
                        animation: 'scan-line 2s infinite'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: 0,
                          right: 0,
                          height: '2px',
                          background: 'var(--primary-500)',
                          animation: 'scan-line-move 2s infinite'
                        }}></div>
                      </div>
                    )}
                  </div>

                  {/* Camera Controls */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 'var(--space-4)',
                    marginBottom: 'var(--space-6)',
                    flexWrap: 'wrap'
                  }}>
                    {!isScanning ? (
                      <button
                        onClick={startCamera}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                      >
                        <Camera size={16} />
                        Start Camera
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={stopCamera}
                          className="btn btn-error"
                          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                        >
                          <CameraOff size={16} />
                          Stop Camera
                        </button>

                        <button
                          onClick={toggleFlash}
                          className={`btn ${flashEnabled ? 'btn-warning' : 'btn-outline'}`}
                          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                        >
                          {flashEnabled ? <FlashlightOff size={16} /> : <Flashlight size={16} />}
                          Flash
                        </button>

                        <button
                          onClick={switchCamera}
                          className="btn btn-outline"
                          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
                        >
                          <RotateCcw size={16} />
                          Switch
                        </button>
                      </>
                    )}
                  </div>

                  {/* Manual Scan for Demo */}
                  <div style={{
                    textAlign: 'center',
                    padding: 'var(--space-4)',
                    background: 'var(--gray-50)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--gray-200)'
                  }}>
                    <p style={{ marginBottom: 'var(--space-3)', color: 'var(--text-secondary)' }}>
                      For demo purposes:
                    </p>
                    <button
                      onClick={handleManualScan}
                      className="btn btn-secondary"
                    >
                      Simulate QR Scan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scan Result */}
          {scanResult && (
            <div className="card">
              <div className="card-content">
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  background: scanResult.success ? 'var(--success-50)' : 'var(--error-50)',
                  border: `1px solid ${scanResult.success ? 'var(--success-200)' : 'var(--error-200)'}`
                }}>
                  {scanResult.success ? (
                    <CheckCircle size={24} style={{ color: 'var(--success-600)' }} />
                  ) : (
                    <XCircle size={24} style={{ color: 'var(--error-600)' }} />
                  )}

                  <div style={{ flex: 1 }}>
                    <h3 style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: scanResult.success ? 'var(--success-700)' : 'var(--error-700)',
                      margin: 0,
                      marginBottom: 'var(--space-1)'
                    }}>
                      {scanResult.success ? 'Check-in Successful!' : 'Check-in Failed'}
                    </h3>
                    <p style={{
                      color: scanResult.success ? 'var(--success-600)' : 'var(--error-600)',
                      margin: 0
                    }}>
                      {scanResult.message}
                    </p>

                    {scanResult.invitee && (
                      <div style={{
                        marginTop: 'var(--space-3)',
                        padding: 'var(--space-3)',
                        background: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--gray-200)'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Email:</span>
                          <span>{scanResult.invitee.email}</span>
                          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Event:</span>
                          <span>{scanResult.invitee.event_name}</span>
                          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Status:</span>
                          <span className="badge badge-success">{scanResult.invitee.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">How to Use</h2>
            </div>
            <div className="card-content">
              <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-600)',
                    fontWeight: 'var(--font-weight-bold)',
                    fontSize: 'var(--font-size-sm)',
                    flexShrink: 0
                  }}>
                    1
                  </div>
                  <div>
                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
                      Start Camera
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      Click "Start Camera" to begin scanning QR codes from attendee passes.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-600)',
                    fontWeight: 'var(--font-weight-bold)',
                    fontSize: 'var(--font-size-sm)',
                    flexShrink: 0
                  }}>
                    2
                  </div>
                  <div>
                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
                      Position QR Code
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      Center the QR code within the scanning area. The system will automatically detect and process it.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                  <div style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--primary-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-600)',
                    fontWeight: 'var(--font-weight-bold)',
                    fontSize: 'var(--font-size-sm)',
                    flexShrink: 0
                  }}>
                    3
                  </div>
                  <div>
                    <h4 style={{ fontSize: 'var(--font-size-base)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
                      Check-in Complete
                    </h4>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      Successful scans will show attendee details and confirmation of check-in.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scan-line {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes scan-line-move {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
    </div>
  );
};

export default Scan;