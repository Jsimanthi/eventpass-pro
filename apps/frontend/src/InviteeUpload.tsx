import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Trash2,
  Users,
  Mail,
  Loader
} from 'lucide-react';

interface InviteeUploadProps {
  eventId: number;
}

interface UploadResult {
  success: boolean;
  message: string;
  processed?: number;
  errors?: string[];
}

const InviteeUpload: React.FC<InviteeUploadProps> = ({ eventId }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewData, setPreviewData] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadResult(null);
      previewFile(selectedFile);
    }
  };

  const previewFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      // Show first 5 lines as preview
      setPreviewData(lines.slice(0, 5));
    };
    reader.readAsText(file);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/events/${eventId}/invitees`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setUploadResult({
          success: true,
          message: `Successfully uploaded ${result.processed || 0} invitees`,
          processed: result.processed
        });
        setFile(null);
        setPreviewData([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        const errorData = await response.json();
        setUploadResult({
          success: false,
          message: errorData.error || 'Upload failed',
          errors: errorData.errors
        });
      }
    } catch (error: any) {
      setUploadResult({
        success: false,
        message: 'Network error. Please try again.',
        errors: [error.message]
      });
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreviewData([]);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,email\nuser1@example.com\nuser2@example.com\nuser3@example.com";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "invitee-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Upload Invitees</h2>
        <p className="card-subtitle">Import attendee emails from a CSV file</p>
      </div>

      <div className="card-content">
        {/* Instructions */}
        <div style={{
          background: 'var(--primary-50)',
          border: '1px solid var(--primary-200)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <FileText size={20} style={{ color: 'var(--primary-600)', marginTop: 'var(--space-1)' }} />
            <div>
              <h4 style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--primary-700)',
                marginBottom: 'var(--space-2)'
              }}>
                CSV Format Requirements
              </h4>
              <ul style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--primary-600)',
                margin: 0,
                paddingLeft: 'var(--space-4)'
              }}>
                <li>Single column with header "email"</li>
                <li>One email address per row</li>
                <li>No empty rows or special characters</li>
                <li>Maximum 10,000 emails per upload</li>
              </ul>
              <button
                onClick={downloadTemplate}
                className="btn btn-sm btn-outline"
                style={{ marginTop: 'var(--space-3)' }}
              >
                <Download size={14} style={{ marginRight: 'var(--space-2)' }} />
                Download Template
              </button>
            </div>
          </div>
        </div>

        {/* File Upload Area */}
        <div style={{
          border: '2px dashed var(--gray-300)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-8)',
          textAlign: 'center',
          background: file ? 'var(--success-50)' : 'var(--gray-50)',
          transition: 'all var(--transition-base)',
          marginBottom: 'var(--space-6)'
        }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            id="file-upload"
          />

          {file ? (
            <div>
              <CheckCircle size={48} style={{ color: 'var(--success-600)', marginBottom: 'var(--space-4)' }} />
              <h3 style={{ color: 'var(--success-700)', marginBottom: 'var(--space-2)' }}>
                File Selected
              </h3>
              <p style={{ color: 'var(--success-600)', marginBottom: 'var(--space-4)' }}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
                <button
                  onClick={clearFile}
                  className="btn btn-outline"
                  disabled={uploading}
                >
                  <Trash2 size={16} style={{ marginRight: 'var(--space-2)' }} />
                  Remove
                </button>
                <button
                  onClick={handleUpload}
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader size={16} className="animate-spin" style={{ marginRight: 'var(--space-2)' }} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={16} style={{ marginRight: 'var(--space-2)' }} />
                      Upload Invitees
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <Upload size={48} style={{ color: 'var(--gray-400)', marginBottom: 'var(--space-4)' }} />
              <h3 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                Drop CSV file here or click to browse
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                Select a CSV file containing email addresses
              </p>
              <label htmlFor="file-upload" className="btn btn-primary">
                <FileText size={16} style={{ marginRight: 'var(--space-2)' }} />
                Choose File
              </label>
            </div>
          )}
        </div>

        {/* File Preview */}
        {previewData.length > 0 && (
          <div style={{ marginBottom: 'var(--space-6)' }}>
            <h4 style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              marginBottom: 'var(--space-3)'
            }}>
              File Preview (First 5 rows)
            </h4>
            <div style={{
              background: 'var(--gray-50)',
              border: '1px solid var(--gray-200)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              fontFamily: 'monospace',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-secondary)',
              maxHeight: '150px',
              overflowY: 'auto'
            }}>
              {previewData.map((line, index) => (
                <div key={index} style={{ marginBottom: 'var(--space-1)' }}>
                  {line}
                </div>
              ))}
              {previewData.length >= 5 && (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  ... and more rows
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${uploadResult.success ? 'var(--success-200)' : 'var(--error-200)'}`,
            background: uploadResult.success ? 'var(--success-50)' : 'var(--error-50)',
            marginBottom: 'var(--space-6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
              {uploadResult.success ? (
                <CheckCircle size={20} style={{ color: 'var(--success-600)', marginTop: 'var(--space-1)' }} />
              ) : (
                <XCircle size={20} style={{ color: 'var(--error-600)', marginTop: 'var(--space-1)' }} />
              )}

              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: uploadResult.success ? 'var(--success-700)' : 'var(--error-700)',
                  marginBottom: 'var(--space-2)'
                }}>
                  {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                </h4>

                <p style={{
                  color: uploadResult.success ? 'var(--success-600)' : 'var(--error-600)',
                  marginBottom: uploadResult.errors ? 'var(--space-3)' : 0
                }}>
                  {uploadResult.message}
                </p>

                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--error-200)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--error-700)'
                  }}>
                    <strong>Errors:</strong>
                    <ul style={{ marginTop: 'var(--space-2)', paddingLeft: 'var(--space-4)' }}>
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {uploadResult.success && uploadResult.processed && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    marginTop: 'var(--space-3)'
                  }}>
                    <Users size={16} style={{ color: 'var(--success-600)' }} />
                    <span style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--success-600)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      {uploadResult.processed} invitees processed
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div style={{
          background: 'var(--warning-50)',
          border: '1px solid var(--warning-200)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--warning-600)', marginTop: 'var(--space-1)' }} />
            <div>
              <h4 style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--warning-700)',
                marginBottom: 'var(--space-2)'
              }}>
                What happens after upload?
              </h4>
              <ul style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--warning-600)',
                margin: 0,
                paddingLeft: 'var(--space-4)'
              }}>
                <li>QR codes are automatically generated for each email</li>
                <li>Invitees receive validation URLs via email</li>
                <li>Each invitee gets 24 hours to validate their attendance</li>
                <li>You can track check-in status in real-time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteeUpload;