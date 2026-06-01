const SECTION_META = {
  'Personal Essentials':      { icon: 'fa-user',           color: '#6366f1' },
  'Professional Narrative':   { icon: 'fa-align-left',     color: '#8b5cf6' },
  'Professional Experience':  { icon: 'fa-briefcase',      color: '#0ea5e9' },
  'Education':                { icon: 'fa-graduation-cap', color: '#14b8a6' },
  'Research & Publications':  { icon: 'fa-flask',          color: '#10b981' },
  'Projects':                 { icon: 'fa-code',           color: '#f59e0b' },
  'Skills & Affiliations':    { icon: 'fa-layer-group',    color: '#ec4899' },
  'Custom Section Titles':    { icon: 'fa-sliders-h',      color: '#6366f1' },
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
          style={{ backgroundColor: `${meta.color}18`, color: meta.color }}
        >
          <i className={`fas ${meta.icon}`} />
        </span>
        <span className="sec-card__title">{title}</span>
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
