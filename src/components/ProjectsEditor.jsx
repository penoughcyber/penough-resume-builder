import { useState, useEffect, useRef } from 'react';
import FormField from './FormField';

const BLANK_PROJECT = {
  name: '',
  linkLabel: '',
  linkUrl: '',
  bullets: [],
  hidden: false,
};

const bulletsToText = (bullets) => (bullets || []).join('\n');
const textToBullets = (text) =>
  text.split('\n').map((l) => l.replace(/^[-•◦]\s*/, '').trimEnd()).filter(Boolean);

const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function ProjectsEditor({ projects = [], onChange }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [rawBullets, setRawBullets] = useState('');
  const rawBulletsRef = useRef('');
  rawBulletsRef.current = rawBullets;
  const list = projects;

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
    const next = list.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    onChange(next);
  };

  const addEntry = () => {
    const newIndex = list.length;
    onChange([...list, { ...BLANK_PROJECT, _id: uid() }]);
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
          {list.length} {list.length === 1 ? 'project' : 'projects'}
        </span>
        <button
          type="button"
          className="btn btn--sm btn--add"
          onClick={addEntry}
          aria-label="Add project"
        >
          <i className="fas fa-plus" />
          Add Project
        </button>
      </div>

      {list.length === 0 && (
        <div className="list-editor__empty">
          <i className="fas fa-code" />
          <p>No projects — this section won't appear on your CV.</p>
          <button type="button" className="btn btn--sm btn--ghost" onClick={addEntry}>
            <i className="fas fa-plus" /> Add your first project
          </button>
        </div>
      )}

      <div className="exp-list">
        {list.map((proj, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={proj._id ?? index}
              className={`exp-entry ${proj.hidden ? 'exp-entry--hidden' : ''} ${isOpen ? 'exp-entry--open' : ''}`}
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
                    {proj.name || 'New Project'}
                  </span>
                  {proj.linkUrl && (
                    <span className="exp-entry__company"> · {proj.linkLabel || proj.linkUrl}</span>
                  )}
                  {proj.hidden && (
                    <span className="exp-entry__hidden-badge">Hidden</span>
                  )}
                </div>
                <div
                  className="exp-entry__row-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={`exp-entry__vis-btn ${proj.hidden ? 'exp-entry__vis-btn--off' : ''}`}
                    onClick={() => updateAt(index, 'hidden', !proj.hidden)}
                    title={proj.hidden ? 'Show on CV' : 'Hide from CV'}
                  >
                    <i className={`fas ${proj.hidden ? 'fa-eye-slash' : 'fa-eye'}`} />
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
                      id={`proj-name-${index}`}
                      label="Project Name"
                      value={proj.name}
                      onChange={(v) => updateAt(index, 'name', v)}
                      placeholder="e.g. Triage-Bot"
                    />
                    <FormField
                      id={`proj-linkLabel-${index}`}
                      label="Link Label"
                      value={proj.linkLabel}
                      onChange={(v) => updateAt(index, 'linkLabel', v)}
                      placeholder="e.g. View Code"
                      optional
                    />
                  </div>

                  <FormField
                    id={`proj-linkUrl-${index}`}
                    label="Link URL"
                    type="url"
                    value={proj.linkUrl}
                    onChange={(v) => updateAt(index, 'linkUrl', v)}
                    placeholder="https://github.com/..."
                    optional
                  />

                  <FormField
                    id={`proj-bullets-${index}`}
                    label="Achievements"
                    value={rawBullets}
                    onChange={(v) => { setRawBullets(v); updateAt(index, 'bullets', textToBullets(v)); }}
                    rows={4}
                    placeholder={'One achievement per line:\nBuilt a CLI tool used by 500+ professionals…\nImplemented Docker-based deployment…'}
                    hint="Each line becomes a separate bullet point on your CV."
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
