import { useState, useEffect, useCallback, useRef } from 'react';
import { pdf } from '@react-pdf/renderer';
import CVEditor from './components/CVEditor';
import CVPreview from './components/CVPreview';
import CVDocument from './components/CVDocument';
import { sampleData, emptyData } from './data/sampleData';
import { loadState, saveState, saveSnapshot, loadSnapshot, clearSnapshot, hasSnapshot } from './utils/storage';

function computeCompletion(data) {
  const checks = [
    !!(data.name?.trim()),
    !!(data.email?.trim() || data.phone?.trim()),
    !!(data.tagline?.trim()),
    !!(data.address?.trim()),
    !!(data.objective?.trim()),
    !!(data.interests?.trim() || data.competencies?.trim()),
    data.experiences?.length > 0 && !!data.experiences[0]?.role,
    data.education?.length > 0 && !!data.education[0]?.school,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export default function App() {
  const [data, setData] = useState(() => loadState(emptyData));
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const [isGenerating, setIsGenerating] = useState(false);
  const [snapshotExists, setSnapshotExists] = useState(() => hasSnapshot());
  const saveTimer = useRef(null);

  const completion = computeCompletion(data);

  useEffect(() => {
    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState(data);
      setSaveStatus('saved');
    }, 800);
    return () => clearTimeout(saveTimer.current);
  }, [data]);

  const handleDataChange = useCallback((next) => {
    setSaveStatus('unsaved');
    setData(next);
  }, []);

  const handleClear = () => {
    if (window.confirm('Clear all fields? This will give you a blank CV to fill in.')) {
      setData(structuredClone(emptyData));
    }
  };

  const handleLoadDemo = () => {
    if (window.confirm('Load the demo CV? Your current work will be saved and you can resume it with the "Resume" button.')) {
      saveSnapshot(data);
      setSnapshotExists(true);
      setData(structuredClone(sampleData));
    }
  };

  const handleRestoreWork = () => {
    const snapshot = loadSnapshot();
    if (!snapshot) return;
    if (window.confirm('Restore your previous work? The current content will be replaced.')) {
      setData(snapshot);
      clearSnapshot();
      setSnapshotExists(false);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(data.name || 'cv').replace(/\s+/g, '-').toLowerCase()}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const next = {
        ...structuredClone(sampleData),
        ...parsed,
        sectionTitles: { ...structuredClone(sampleData.sectionTitles), ...(parsed.sectionTitles || {}) },
      };
      setData(next);
    } catch {
      alert('Invalid JSON file. Please upload a valid CV backup.');
    } finally {
      e.target.value = '';
    }
  };

  const handleDownloadPdf = async () => {
    setIsGenerating(true);
    try {
      const blob = await pdf(<CVDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(data.name || 'professional-cv').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveLabel = saveStatus === 'saved'
    ? 'All changes saved'
    : saveStatus === 'saving'
    ? 'Saving…'
    : 'Unsaved changes';

  const saveIcon = saveStatus === 'saved' ? 'fa-check-circle' : saveStatus === 'saving' ? 'fa-sync fa-spin' : 'fa-circle';

  return (
    <div className="app-shell">
      <aside className="editor-panel">
        {/* Header */}
        <header className="editor-header">
          <div className="editor-brand">
            <div className="editor-brand__logo">
              <i className="fas fa-file-alt" />
            </div>
            <div className="editor-brand__text">
              <span className="editor-brand__name">ProCV Builder</span>
              <span className="editor-brand__sub">ATS-friendly · Offline-first</span>
            </div>
          </div>
          <div className={`save-chip save-chip--${saveStatus}`}>
            <i className={`fas ${saveIcon}`} />
            <span>{saveLabel}</span>
          </div>
        </header>

        {/* Progress bar */}
        <div className="progress-bar-wrap">
          <div className="progress-bar-wrap__labels">
            <span>Profile completion</span>
            <span className="progress-bar-wrap__pct">{completion}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${completion}%` }}
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
        </div>

        {/* Toolbar */}
        <div className="editor-toolbar">
          <button type="button" className="tool-btn tool-btn--danger" onClick={handleClear} title="Clear all fields">
            <i className="fas fa-trash-alt" />
            <span>Clear</span>
          </button>
          <button type="button" className="tool-btn tool-btn--demo" onClick={handleLoadDemo} title="Load demo CV">
            <i className="fas fa-magic" />
            <span>Demo</span>
          </button>
          {snapshotExists && (
            <button type="button" className="tool-btn tool-btn--restore" onClick={handleRestoreWork} title="Restore your previous work">
              <i className="fas fa-history" />
              <span>Resume</span>
            </button>
          )}
          <button type="button" className="tool-btn" onClick={handleExportJson} title="Export JSON backup">
            <i className="fas fa-download" />
            <span>Export</span>
          </button>
          <label className="tool-btn" htmlFor="uploadJsonInput" title="Import JSON backup">
            <i className="fas fa-upload" />
            <span>Import</span>
          </label>
          <input id="uploadJsonInput" type="file" accept="application/json" onChange={handleImportJson} />
        </div>

        {/* Form */}
        <div className="editor-content">
          <CVEditor data={data} onDataChange={handleDataChange} />
        </div>
      </aside>

      {/* Preview */}
      <main className="preview-pane">
        <div className="preview-topbar">
          <div className="preview-topbar__left">
            <div className="preview-topbar__live">
              <span className="live-dot" />
              Live Preview
            </div>
            <span className="preview-topbar__name">{data.name || 'Your CV'}</span>
          </div>
          <button
            type="button"
            className={`btn-download ${isGenerating ? 'btn-download--loading' : ''}`}
            onClick={handleDownloadPdf}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <><i className="fas fa-sync fa-spin" /> Generating…</>
            ) : (
              <><i className="fas fa-file-pdf" /> Download PDF</>
            )}
          </button>
        </div>

        <div className="preview-canvas">
          <CVPreview data={data} />
        </div>
      </main>
    </div>
  );
}
