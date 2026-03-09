import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Profile } from '../types';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const ResumeUpload: React.FC<{
  onUploadSuccess?: (profile: Profile) => void;
}> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.pdf') || f.name.endsWith('.docx'))) {
      setFile(f);
      setError(null);
      setSuccess(null);
    } else {
      setError('Only PDF and DOCX files are allowed');
      setFile(null);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && (f.name.endsWith('.pdf') || f.name.endsWith('.docx'))) {
      setFile(f);
      setError(null);
      setSuccess(null);
    } else if (f) {
      setError('Only PDF and DOCX files are allowed');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post<Profile>(`${API_BASE}/resumes/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(`Profile created for ${res.data.name}`);
      setFile(null);
      onUploadSuccess?.(res.data);
    } catch (err: unknown) {
      let msg = 'Upload failed';
      if (axios.isAxiosError(err)) {
        const d = err.response?.data;
        msg = Array.isArray(d?.message) ? d.message.join(', ') : d?.message || err.message;
      }
      setError(String(msg));
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="resume-upload">
      <h3>Upload Resume</h3>
      <p>Upload a PDF or DOCX resume to add a candidate. The system will extract structured data using AI.</p>
      <div
        className={`drop-zone ${file ? 'has-file' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileChange}
          id="resume-file"
          style={{ display: 'none' }}
        />
        <label htmlFor="resume-file" className="drop-label">
          {file ? file.name : 'Drag & drop or click to select PDF/DOCX'}
        </label>
      </div>
      {error && <p className="upload-error">{error}</p>}
      {success && <p className="upload-success">{success}</p>}
      <div className="upload-actions">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload & Parse'}
        </button>
        {file && (
          <button type="button" onClick={handleClear} disabled={uploading}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;
