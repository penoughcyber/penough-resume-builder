import FormField from './FormField';

const BLANK_EDUCATION = {
  school: '',
  degree: '',
  dateRange: '',
  gpa: '',
  advisor: '',
  areas: '',
  awards: '',
  hidden: false,
};

export default function EducationEditor({ education = [], onChange }) {
  const list = education;

  const updateAt = (index, field, value) => {
    const next = list.map((e, i) =>
      i === index ? { ...e, [field]: value } : e
    );
    onChange(next);
  };

  const addEntry = () => onChange([...list, { ...BLANK_EDUCATION }]);
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
          aria-label="Add education"
        >
          <i className="fas fa-plus" />
          Add Education
        </button>
      </div>

      {list.length === 0 && (
        <div className="list-editor__empty">
          <i className="fas fa-graduation-cap" />
          <p>No education entries — this section won't appear on your CV.</p>
          <button type="button" className="btn btn--sm btn--ghost" onClick={addEntry}>
            <i className="fas fa-plus" /> Add your first education
          </button>
        </div>
      )}

      {list.map((edu, index) => (
        <div key={index} className={`entry-card entry-card--compact ${edu.hidden ? 'entry-card--hidden' : ''}`}>
          <div className="entry-card__header">
            <div className="entry-card__meta">
              <span className="entry-card__num">{index + 1}</span>
              <span className="entry-card__title-preview">
                {edu.school || 'New Institution'}
                {edu.degree && <span className="entry-card__at"> · {edu.degree}</span>}
              </span>
              {edu.hidden && <span className="entry-card__hidden-badge">Hidden from CV</span>}
            </div>
            <div className="entry-card__actions">
              <button
                type="button"
                className={`entry-card__vis-btn ${edu.hidden ? 'entry-card__vis-btn--off' : ''}`}
                onClick={() => updateAt(index, 'hidden', !edu.hidden)}
                title={edu.hidden ? 'Show on CV' : 'Hide from CV'}
              >
                <i className={`fas ${edu.hidden ? 'fa-eye-slash' : 'fa-eye'}`} />
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
                id={`edu-school-${index}`}
                label="School / Institution"
                value={edu.school}
                onChange={(v) => updateAt(index, 'school', v)}
                placeholder="e.g. Stanford University"
              />
              <FormField
                id={`edu-date-${index}`}
                label="Date Range"
                value={edu.dateRange}
                onChange={(v) => updateAt(index, 'dateRange', v)}
                placeholder="e.g. 2018 – 2022"
              />
            </div>
            <div className="entry-card__row entry-card__row--2">
              <FormField
                id={`edu-degree-${index}`}
                label="Degree & Field"
                value={edu.degree}
                onChange={(v) => updateAt(index, 'degree', v)}
                placeholder="e.g. B.S. in Computer Science"
              />
              <FormField
                id={`edu-gpa-${index}`}
                label="GPA / CGPA"
                value={edu.gpa}
                onChange={(v) => updateAt(index, 'gpa', v)}
                placeholder="e.g. 3.8/4.0 or 8.6/10"
                optional
              />
            </div>
            <div className="entry-card__row entry-card__row--2">
              <FormField
                id={`edu-advisor-${index}`}
                label="Advisor"
                value={edu.advisor}
                onChange={(v) => updateAt(index, 'advisor', v)}
                placeholder="Optional"
                optional
              />
              <FormField
                id={`edu-areas-${index}`}
                label="Focused Areas"
                value={edu.areas}
                onChange={(v) => updateAt(index, 'areas', v)}
                placeholder="e.g. ML, Security"
                optional
              />
            </div>
            <FormField
              id={`edu-awards-${index}`}
              label="Awards"
              value={edu.awards}
              onChange={(v) => updateAt(index, 'awards', v)}
              placeholder="e.g. Dean's List, Fellowship"
              optional
            />
          </div>
        </div>
      ))}
    </div>
  );
}
