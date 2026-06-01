import React, { useRef, useState } from 'react';
import styles from './FileUploader.module.css';

export default function FileUploader({ onExtracted, onLoading, compact = false }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.gif', '.bmp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const validateFile = (file) => {
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      setError(`Unsupported file type: ${fileExt}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return false;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return false;
    }
    
    return true;
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    console.log('START handleFile:', file.name);
    
    if (!validateFile(file)) {
      alert('File validation failed');
      return;
    }

    setError(null);
    onLoading?.(true);
    setUploadProgress(50);

    try {
      const formData = new FormData();
      formData.append('file', file);
      console.log('Sending to /api/ai/extract-resume-ai/');

      const response = await fetch('/api/ai/extract-resume-ai/', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      const text = await response.text();
      if (!response.ok) {
        try {
          const err = JSON.parse(text);
          setError(err.error || 'Error: ' + response.statusText);
        } catch {
          setError('Error: ' + response.statusText);
        }
        onLoading?.(false);
        return;
      }

      const data = JSON.parse(text);
      console.log('SUCCESS - Data:', data);
      setUploadProgress(100);
      onLoading?.(false);
      setTimeout(() => setUploadProgress(0), 1000);
      onExtracted?.(data);
      
    } catch (err) {
      console.error('Exception:', err);
      setError('Error: ' + err.message);
      onLoading?.(false);
    }
  };

  const handleFileInputChange = (e) => {
    console.log('🖱️ FileUploader: onChange fired');
    const files = e.target.files;
    if (!files || files.length === 0) {
      console.warn('⚠️ No files selected');
      return;
    }
    console.log('✅ File selected:', files[0].name);
    handleFile(files[0]);
  };

  const handleClick = () => {
    console.log('�️ FileUploader: [SELECT FILE] button clicked at', new Date().toLocaleTimeString());
    console.log('   fileInputRef exists?', !!fileInputRef.current);
    if (fileInputRef.current) {
      fileInputRef.current?.click();
      console.log('   ✅ File picker should be opening now...');
    } else {
      console.error('   ❌ ERROR: fileInputRef is NULL!');
    }
  };

  if (compact) {
    // Compact inline upload button
    return (
      <div className={styles.compactUploader}>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClick();
          }}
          className={styles.uploadButton}
          title="Upload resume (PDF, DOCX, or Image)"
        >
          📎
        </button>
        {error && <span className={styles.compactError}>{error}</span>}
      </div>
    );
  }

  // Full upload zone
  return (
    <div className={styles.uploaderContainer} onClick={(e) => e.stopPropagation()}>
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.dropContent}>
          <div className={styles.icon}>📁</div>
          <h3>Upload Resume File</h3>
          <p>PDF, Word, or Image • Max 5MB</p>
          <button
            type="button"
            className={styles.selectButton} 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClick();
            }}
          >
            Select File
          </button>
          <p className={styles.dragHint}>or drag and drop</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className={styles.progressBar}>
          <div
            className={styles.progress}
            style={{ width: `${uploadProgress}%` }}
          />
          <span>{uploadProgress}%</span>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <span>⚠️ {error}</span>
        </div>
      )}
    </div>
  );
}
