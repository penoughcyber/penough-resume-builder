const SECTION_META = {
  'Personal Essentials':       { icon: 'fa-user-circle',      color: '#6366f1' },
  'Professional Narrative':    { icon: 'fa-pen-nib',          color: '#8b5cf6' },
  'Professional Experience':   { icon: 'fa-briefcase',        color: '#0ea5e9' },
  'Education':                 { icon: 'fa-graduation-cap',   color: '#14b8a6' },
  'Research, Projects & Pubs': { icon: 'fa-flask',            color: '#10b981' },
  'Skills & Affiliations':     { icon: 'fa-layer-group',      color: '#f59e0b' },
  'Custom Section Titles':     { icon: 'fa-sliders-h',        color: '#ec4899' },
};

export default function FormSection({ title, children, isOpen, onToggle }) {
  const meta = SECTION_META[title] || { icon: 'fa-folder', color: '#6366f1' };

  return (
    <div className={`sec-card ${isOpen ? 'sec-card--open' : ''}`}>
      <button
        type="button"
        className="sec-card__trigger"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span
          className="sec-card__icon"
          style={{ '--sec-color': meta.color, backgroundColor: `${meta.color}15` }}
        >
          <i className={`fas ${meta.icon}`} style={{ color: meta.color }} />
        </span>
        <span className="sec-card__title">{title}</span>
        <span className="sec-card__badge">{isOpen ? 'Editing' : 'Click to edit'}</span>
        <span className="sec-card__arrow">
          <i className="fas fa-chevron-down" />
        </span>
      </button>

      <div className="sec-card__body">
        <div className="sec-card__inner">
          {children}
        </div>
      </div>
    </div>
  );
}
