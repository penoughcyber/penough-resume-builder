import { useState, useEffect, useRef } from 'react';
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
  const [openIndex, setOpenIndex] = useState(null);
  const [rawBullets, setRawBullets] = useState('');
  const rawBulletsRef = useRef('');
  rawBulletsRef.current = rawBullets;
  const list = experiences;

  // Re-initialise rawBullets whenever the open entry changes, using ref to
  // avoid stale closures without triggering unnecessary resets while typing.
  const openBullets = openIndex !== null ? list[openIndex]?.bullets : null;
  useEffect(() => {
    if (openIndex === null) { setRawBullets(''); return; }
    const incoming = list[openIndex]?.bullets || [];
    if (JSON.stringify(textToBullets(rawBulletsRef.current)) !== JSON.stringify(incoming)) {
      setRawBullets(bulletsToText(incoming));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openIndex, openBullets]);

  const updateAt = (index, field, value) => {
    const next = list.map((e, i) =>
      i === index ? { ...e, [field]: value } : e
    );
    onChange(next);
  };

  const addEntry = () => {
    const newIndex = list.length;
    onChange([...list, { ...BLANK_EXPERIENCE }]);
    setOpenIndex(newIndex);
    setRawBullets('');
  };

  const removeEntry = (index) => {
    onChange(list.filter((_, i) => i !== index));
    setOpenIndex(null);
    setRawBullets('');
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

      <div className="exp-list">
        {list.map((exp, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`exp-entry ${exp.hidden ? 'exp-entry--hidden' : ''} ${isOpen ? 'exp-entry--open' : ''}`}
            >
              {/* ── Compact row ── */}
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
                    {exp.role || 'New Experience'}
                  </span>
                  {exp.company && (
                    <span className="exp-entry__company">, {exp.company}</span>
                  )}
                  {exp.hidden && (
                    <span className="exp-entry__hidden-badge">Hidden</span>
                  )}
                </div>

                <div
                  className="exp-entry__row-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={`exp-entry__vis-btn ${exp.hidden ? 'exp-entry__vis-btn--off' : ''}`}
                    onClick={() => updateAt(index, 'hidden', !exp.hidden)}
                    title={exp.hidden ? 'Show on CV' : 'Hide from CV'}
                  >
                    <i className={`fas ${exp.hidden ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                  <span className="exp-entry__chevron">
                    <i className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`} />
                  </span>
                </div>
              </div>

              {/* ── Expanded edit form ── */}
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
                      id={`exp-date-${index}`}
                      label="Date Range"
                      value={exp.dateRange}
                      onChange={(v) => updateAt(index, 'dateRange', v)}
                      placeholder="e.g. Jan 2022 – Present"
                    />
                    <FormField
                      id={`exp-location-${index}`}
                      label="Location"
                      value={exp.location}
                      onChange={(v) => updateAt(index, 'location', v)}
                      placeholder="City, Country"
                      optional
                    />
                  </div>

                  <FormField
                    id={`exp-bullets-${index}`}
                    label="Achievements & Responsibilities"
                    value={rawBullets}
                    onChange={(v) => { setRawBullets(v); updateAt(index, 'bullets', textToBullets(v)); }}
                    rows={5}
                    placeholder={'One achievement per line. Start with action verbs:\nLed a team of 8 analysts…\nArchitected an automated detection framework…'}
                    hint="Each line becomes a separate bullet point on your CV."
                  />

                  <FormField
                    id={`exp-focus-${index}`}
                    label="Focus Areas (comma-separated)"
                    value={exp.focus}
                    onChange={(v) => updateAt(index, 'focus', v)}
                    placeholder="e.g. Automation, IR, SIEM"
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
