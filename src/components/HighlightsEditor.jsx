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
  const list = highlights;

  const updateAt = (index, field, value) => {
    const next = list.map((h, i) =>
      i === index ? { ...h, [field]: value } : h
    );
    onChange(next);
  };

  const addEntry = () => onChange([...list, { ...BLANK_HIGHLIGHT }]);
  const removeEntry = (index) => onChange(list.filter((_, i) => i !== index));

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

      {list.map((h, index) => (
        <div key={index} className={`entry-card entry-card--compact ${h.hidden ? 'entry-card--hidden' : ''}`}>
          <div className="entry-card__header">
            <div className="entry-card__meta">
              <span className="entry-card__num">{index + 1}</span>
              <span className="entry-card__title-preview">
                {h.title || 'New Achievement'}
                {h.status && <span className="entry-card__at"> · {h.status}</span>}
              </span>
              {h.hidden && <span className="entry-card__hidden-badge">Hidden from CV</span>}
            </div>
            <div className="entry-card__actions">
              <button
                type="button"
                className={`entry-card__vis-btn ${h.hidden ? 'entry-card__vis-btn--off' : ''}`}
                onClick={() => updateAt(index, 'hidden', !h.hidden)}
                title={h.hidden ? 'Show on CV' : 'Hide from CV'}
              >
                <i className={`fas ${h.hidden ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
              <button
                type="button"
                className="entry-card__remove"
                onClick={() => removeEntry(index)}
                aria-label={`Remove entry ${index + 1}`}
                title="Remove"
              >
                <i className="fas fa-trash-alt" />
              </button>
            </div>
          </div>
          <div className="entry-card__body">
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
          </div>
        </div>
      ))}
    </div>
  );
}
