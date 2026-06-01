import React, { useState } from 'react';
import styles from './MergePreview.module.css';

export default function MergePreview({
  extractedData,
  currentData,
  conflicts,
  onMergeComplete,
  onCancel,
  isLoading = false,
}) {
  const [mergeChoices, setMergeChoices] = useState(() => {
    // Initialize with recommendations from conflicts or keep current
    const choices = {};
    if (conflicts && conflicts.length > 0) {
      conflicts.forEach((conflict) => {
        choices[conflict.field] = conflict.recommendation || 'keep';
      });
    }
    return choices;
  });

  const handleChoice = (field, choice) => {
    setMergeChoices((prev) => ({
      ...prev,
      [field]: choice,
    }));
  };

  const handleMerge = () => {
    onMergeComplete?.(mergeChoices);
  };

  // Organize conflicts by resume section
  const sectionGroups = {
    personal: {
      title: '👤 Personal Information',
      fields: ['name', 'email', 'phone', 'address', 'website', 'linkedin', 'github', 'googleScholar', 'portfolio'],
    },
    professional: {
      title: '💼 Professional Section',
      fields: ['tagline', 'objective', 'interests', 'competencies', 'technologies'],
    },
    experience: {
      title: '🏢 Professional Experience',
      fields: ['experiences'],
    },
    education: {
      title: '🎓 Education',
      fields: ['education'],
    },
    highlights: {
      title: '⭐ Key Achievements',
      fields: ['highlights'],
    },
    projects: {
      title: '🛠️ Projects',
      fields: ['projects'],
    },
    other: {
      title: '📝 Other',
      fields: ['certifications', 'volunteering', 'books'],
    },
  };

  const getConflictsForField = (field) => {
    return (conflicts || []).filter((c) => c.field === field);
  };

  const ConflictRow = ({ conflict }) => {
    const choice = mergeChoices[conflict.field] || 'keep';

    return (
      <div key={`${conflict.field}-${choice}`} className={styles.conflictRow}>
        <div className={styles.fieldName}>{conflict.field}</div>

        <div className={styles.options}>
          <label className={`${styles.option} ${choice === 'keep' ? styles.selected : ''}`}>
            <input
              type="radio"
              name={`merge-${conflict.field}`}
              value="keep"
              checked={choice === 'keep'}
              onChange={() => handleChoice(conflict.field, 'keep')}
              disabled={isLoading}
            />
            <span className={styles.optionLabel}>Keep Current</span>
          </label>

          <label className={`${styles.option} ${choice === 'extracted' ? styles.selected : ''}`}>
            <input
              type="radio"
              name={`merge-${conflict.field}`}
              value="extracted"
              checked={choice === 'extracted'}
              onChange={() => handleChoice(conflict.field, 'extracted')}
              disabled={isLoading}
            />
            <span className={styles.optionLabel}>Use Extracted</span>
          </label>

          {conflict.recommendation && (
            <div className={styles.recommendation}>
              AI recommends: <strong>{conflict.recommendation}</strong>
            </div>
          )}
        </div>

        <div className={styles.preview}>
          <div className={styles.previewItem}>
            <div className={styles.previewLabel}>Current:</div>
            <div className={styles.previewValue}>{formatValue(conflict.current)}</div>
          </div>
          <div className={styles.previewItem}>
            <div className={styles.previewLabel}>Extracted:</div>
            <div className={styles.previewValue}>{formatValue(conflict.extracted)}</div>
          </div>
        </div>
      </div>
    );
  };

  const formatValue = (value) => {
    if (!value) return '(empty)';
    if (typeof value === 'object') {
      return typeof value === 'string' ? value : JSON.stringify(value).slice(0, 100);
    }
    const str = String(value);
    return str.length > 100 ? str.slice(0, 100) + '...' : str;
  };

  const renderSection = (sectionKey) => {
    const section = sectionGroups[sectionKey];
    const sectionConflicts = section.fields
      .flatMap((field) => getConflictsForField(field))
      .filter((c) => c); // Remove empty

    if (sectionConflicts.length === 0) return null;

    return (
      <div key={sectionKey} className={styles.section}>
        <h3 className={styles.sectionTitle}>{section.title}</h3>
        <div className={styles.conflicts}>
          {sectionConflicts.map((conflict) => (
            <ConflictRow key={conflict.field} conflict={conflict} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.mergePreviewContainer}>
      <div className={styles.header}>
        <h2>Review & Merge Resume Data</h2>
        <p>Choose which data to keep for each conflicting field</p>
      </div>

      {(!conflicts || conflicts.length === 0) ? (
        <div className={styles.noConflicts}>
          <p>✓ No conflicts detected. Ready to merge!</p>
        </div>
      ) : (
        <div className={styles.content}>
          {Object.keys(sectionGroups).map((key) => renderSection(key))}
        </div>
      )}

      <div className={styles.actions}>
        <button
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          className={styles.mergeButton}
          onClick={handleMerge}
          disabled={isLoading}
        >
          {isLoading ? 'Merging...' : 'Apply Merge'}
        </button>
      </div>
    </div>
  );
}

export function MergePreviewModal({ isOpen, onClose, ...props }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
        <MergePreview {...props} onCancel={onClose} />
      </div>
    </div>
  );
}
