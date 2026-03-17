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

export default function ProjectsEditor({ projects = [], onChange }) {
  const list = projects;

  const updateAt = (index, field, value) => {
    const next = list.map((p, i) =>
      i === index ? { ...p, [field]: value } : p
    );
    onChange(next);
  };

  const addEntry = () => onChange([...list, { ...BLANK_PROJECT }]);
  const removeEntry = (index) => onChange(list.filter((_, i) => i !== index));

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

      {list.map((proj, index) => (
        <div key={index} className={`entry-card ${proj.hidden ? 'entry-card--hidden' : ''}`}>
          <div className="entry-card__header">
            <div className="entry-card__meta">
              <span className="entry-card__num">{index + 1}</span>
              <span className="entry-card__title-preview">
                {proj.name || 'New Project'}
              </span>
              {proj.hidden && <span className="entry-card__hidden-badge">Hidden from CV</span>}
            </div>
            <div className="entry-card__actions">
              <button
                type="button"
                className={`entry-card__vis-btn ${proj.hidden ? 'entry-card__vis-btn--off' : ''}`}
                onClick={() => updateAt(index, 'hidden', !proj.hidden)}
                title={proj.hidden ? 'Show on CV' : 'Hide from CV'}
              >
                <i className={`fas ${proj.hidden ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
              <button
                type="button"
                className="entry-card__remove"
                onClick={() => removeEntry(index)}
                aria-label={`Remove project ${index + 1}`}
                title="Remove"
              >
                <i className="fas fa-trash-alt" />
              </button>
            </div>
          </div>
          <div className="entry-card__body">
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
              value={proj.linkUrl}
              onChange={(v) => updateAt(index, 'linkUrl', v)}
              placeholder="https://github.com/..."
              optional
            />
            <FormField
              id={`proj-bullets-${index}`}
              label="Achievements"
              value={bulletsToText(proj.bullets)}
              onChange={(v) => updateAt(index, 'bullets', textToBullets(v))}
              rows={4}
              placeholder={'One achievement per line:\nBuilt a CLI tool used by 500+ professionals…\nImplemented Docker-based deployment…'}
              hint="Each line becomes a separate bullet point on your CV."
            />
          </div>
        </div>
      ))}
    </div>
  );
}
