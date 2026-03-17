import { useState } from 'react';
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
  const [openIndex, setOpenIndex] = useState(null);
  const list = education;

  const updateAt = (index, field, value) => {
    const next = list.map((e, i) =>
      i === index ? { ...e, [field]: value } : e
    );
    onChange(next);
  };

  const addEntry = () => {
    const newIndex = list.length;
    onChange([...list, { ...BLANK_EDUCATION }]);
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

      <div className="exp-list">
        {list.map((edu, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`exp-entry ${edu.hidden ? 'exp-entry--hidden' : ''} ${isOpen ? 'exp-entry--open' : ''}`}
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
                    {edu.school || 'New Institution'}
                  </span>
                  {edu.degree && (
                    <span className="exp-entry__company"> · {edu.degree}</span>
                  )}
                  {edu.hidden && (
                    <span className="exp-entry__hidden-badge">Hidden</span>
                  )}
                </div>
                <div
                  className="exp-entry__row-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={`exp-entry__vis-btn ${edu.hidden ? 'exp-entry__vis-btn--off' : ''}`}
                    onClick={() => updateAt(index, 'hidden', !edu.hidden)}
                    title={edu.hidden ? 'Show on CV' : 'Hide from CV'}
                  >
                    <i className={`fas ${edu.hidden ? 'fa-eye-slash' : 'fa-eye'}`} />
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
