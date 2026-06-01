import { useState } from 'react';
import FormField from './FormField';

const BLANK_HIGHLIGHT = {
  title: '',
  status: '',
  description: '',
  linkLabel: '',
  linkUrl: '',
  hidden: false,
};

export default function HighlightsEditor({ highlights = [], onChange }) {
  const [openIndex, setOpenIndex] = useState(null);
  const list = highlights;

  const updateAt = (index, field, value) => {
    const next = list.map((h, i) =>
      i === index ? { ...h, [field]: value } : h
    );
    onChange(next);
  };

  const addEntry = () => {
    const newIndex = list.length;
    onChange([...list, { ...BLANK_HIGHLIGHT }]);
    setOpenIndex(newIndex);
  };

  const removeEntry = (index) => {
    onChange(list.filter((_, i) => i !== index));
    setOpenIndex(null);
  };

  const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <div className="list-editor">
      <div className="list-editor__header">
        <span className="list-editor__count">
          {list.length} {list.length === 1 ? 'entry' : 'entries'}
        </span>
        <button
          type="button"
          className="btn btn--sm btn--add"
          onClick={addEntry}
          aria-label="Add highlight"
        >
          <i className="fas fa-plus" />
          Add Highlight
        </button>
      </div>

      {list.length === 0 && (
        <div className="list-editor__empty">
          <i className="fas fa-trophy" />
          <p>No entries — this section won't appear on your CV.</p>
          <button type="button" className="btn btn--sm btn--ghost" onClick={addEntry}>
            <i className="fas fa-plus" /> Add your first achievement
          </button>
        </div>
      )}

      <div className="exp-list">
        {list.map((h, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`exp-entry ${h.hidden ? 'exp-entry--hidden' : ''} ${isOpen ? 'exp-entry--open' : ''}`}
            >
              {/* Compact row */}
              <div
                className="exp-entry__row"
                onClick={() => toggle(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && toggle(index)}
                aria-expanded={isOpen}
              >
                <span className="exp-entry__grip" aria-hidden="true">
                  <i className="fas fa-grip-vertical" />
                </span>
                <div className="exp-entry__label">
                  <span className="exp-entry__role">
                    {h.title || 'New Achievement'}
                  </span>
                  {h.status && (
                    <span className="exp-entry__company"> · {h.status}</span>
                  )}
                  {h.hidden && (
                    <span className="exp-entry__hidden-badge">Hidden</span>
                  )}
                </div>
                <div
                  className="exp-entry__row-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={`exp-entry__vis-btn ${h.hidden ? 'exp-entry__vis-btn--off' : ''}`}
                    onClick={() => updateAt(index, 'hidden', !h.hidden)}
                    title={h.hidden ? 'Show on CV' : 'Hide from CV'}
                  >
                    <i className={`fas ${h.hidden ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                  <span className="exp-entry__chevron">
                    <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} />
                  </span>
                </div>
              </div>

              {/* Expanded edit form */}
              {isOpen && (
                <div className="exp-entry__form">
                  <div className="exp-entry__form-header">
                    <span className="exp-entry__form-title">
                      <i className="fas fa-pen" /> Edit Entry
                    </span>
                    <button
                      type="button"
                      className="entry-card__remove"
                      onClick={() => removeEntry(index)}
                      title="Delete this entry"
                    >
                      <i className="fas fa-trash-alt" />
                    </button>
                  </div>

                  <div className="entry-card__row entry-card__row--2">
                    <FormField
                      id={`hl-title-${index}`}
                      label="Title"
                      value={h.title}
                      onChange={(v) => updateAt(index, 'title', v)}
                      placeholder="e.g. CISSP Certification"
                    />
                    <FormField
                      id={`hl-status-${index}`}
                      label="Status / Date"
                      value={h.status}
                      onChange={(v) => updateAt(index, 'status', v)}
                      placeholder="e.g. Certified 2023"
                    />
                  </div>

                  <FormField
                    id={`hl-desc-${index}`}
                    label="Description"
                    value={h.description}
                    onChange={(v) => updateAt(index, 'description', v)}
                    rows={3}
                    placeholder="Brief description..."
                  />

                  <div className="entry-card__row entry-card__row--2">
                    <FormField
                      id={`hl-linkLabel-${index}`}
                      label="Link Label"
                      value={h.linkLabel}
                      onChange={(v) => updateAt(index, 'linkLabel', v)}
                      placeholder="e.g. View Certificate"
                      optional
                    />
                    <FormField
                      id={`hl-linkUrl-${index}`}
                      label="Link URL"
                      value={h.linkUrl}
                      onChange={(v) => updateAt(index, 'linkUrl', v)}
                      placeholder="https://..."
                      optional
                    />
                  </div>

                  <button
                    type="button"
                    className="exp-entry__done-btn"
                    onClick={() => setOpenIndex(null)}
                  >
                    <i className="fas fa-check" /> Done
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
