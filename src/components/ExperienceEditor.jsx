import FormField from './FormField';

const BLANK_EXPERIENCE = {
  role: '',
  company: '',
  location: '',
  dateRange: '',
  bullets: [],
  focus: '',
  hidden: false,
};

const bulletsToText = (bullets) => (bullets || []).join('\n');
const textToBullets = (text) =>
  text.split('\n').map((l) => l.replace(/^[-•◦]\s*/, '').trimEnd()).filter(Boolean);

export default function ExperienceEditor({ experiences = [], onChange }) {
  const list = experiences;

  const updateAt = (index, field, value) => {
    const next = list.map((e, i) =>
      i === index ? { ...e, [field]: value } : e
    );
    onChange(next);
  };

  const addEntry = () => onChange([...list, { ...BLANK_EXPERIENCE }]);
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
          aria-label="Add experience"
        >
          <i className="fas fa-plus" />
          Add Experience
        </button>
      </div>

      {list.length === 0 && (
        <div className="list-editor__empty">
          <i className="fas fa-briefcase" />
          <p>No experience entries — this section won't appear on your CV.</p>
          <button type="button" className="btn btn--sm btn--ghost" onClick={addEntry}>
            <i className="fas fa-plus" /> Add your first experience
          </button>
        </div>
      )}

      {list.map((exp, index) => (
        <div key={index} className={`entry-card ${exp.hidden ? 'entry-card--hidden' : ''}`}>
          <div className="entry-card__header">
            <div className="entry-card__meta">
              <span className="entry-card__num">{index + 1}</span>
              <span className="entry-card__title-preview">
                {exp.role || 'New Experience'}
                {exp.company && <span className="entry-card__at"> @ {exp.company}</span>}
              </span>
              {exp.hidden && <span className="entry-card__hidden-badge">Hidden from CV</span>}
            </div>
            <div className="entry-card__actions">
              <button
                type="button"
                className={`entry-card__vis-btn ${exp.hidden ? 'entry-card__vis-btn--off' : ''}`}
                onClick={() => updateAt(index, 'hidden', !exp.hidden)}
                title={exp.hidden ? 'Show on CV' : 'Hide from CV'}
              >
                <i className={`fas ${exp.hidden ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
              <button
                type="button"
                className="entry-card__remove"
                onClick={() => removeEntry(index)}
                aria-label={`Remove entry ${index + 1}`}
                title="Delete entry"
              >
                <i className="fas fa-trash-alt" />
              </button>
            </div>
          </div>

          <div className="entry-card__body">
            <div className="entry-card__row entry-card__row--2">
              <FormField
                id={`exp-role-${index}`}
                label="Job Title"
                value={exp.role}
                onChange={(v) => updateAt(index, 'role', v)}
                placeholder="e.g. Senior Software Engineer"
              />
              <FormField
                id={`exp-company-${index}`}
                label="Company"
                value={exp.company}
                onChange={(v) => updateAt(index, 'company', v)}
                placeholder="Company name"
              />
            </div>
            <div className="entry-card__row entry-card__row--2">
              <FormField
                id={`exp-location-${index}`}
                label="Location"
                value={exp.location}
                onChange={(v) => updateAt(index, 'location', v)}
                placeholder="City, State/Country"
                optional
              />
              <FormField
                id={`exp-date-${index}`}
                label="Date Range"
                value={exp.dateRange}
                onChange={(v) => updateAt(index, 'dateRange', v)}
                placeholder="e.g. Jan 2022 – Present"
              />
            </div>

            <FormField
              id={`exp-bullets-${index}`}
              label="Achievements & Responsibilities"
              value={bulletsToText(exp.bullets)}
              onChange={(v) => updateAt(index, 'bullets', textToBullets(v))}
              rows={5}
              placeholder={'One achievement per line. Start with action verbs:\nLed a team of 8 analysts…\nArchitected an automated detection framework…'}
              hint="Each line becomes a separate bullet point on your CV."
            />

            <FormField
              id={`exp-focus-${index}`}
              label="Focus areas (comma-separated)"
              value={exp.focus}
              onChange={(v) => updateAt(index, 'focus', v)}
              placeholder="e.g. Automation, IR, SIEM"
              optional
            />
          </div>
        </div>
      ))}
    </div>
  );
}
