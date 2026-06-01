import { useState, useEffect, useRef } from 'react';
import FormField from './FormField';
import RichTextEditor from './RichTextEditor';

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

// Convert bullets array to HTML for rich text editor (one bullet per <p>)
const bulletsToHtml = (bullets) => {
  if (!bullets || bullets.length === 0) return '';
  return bullets.map(b => `<p>${b}</p>`).join('');
};

// Convert HTML from rich text editor back to bullets array
const htmlToBullets = (html) => {
  if (!html || !html.trim()) return [];
  
  // Create temp element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  const bullets = [];
  
  // Helper to get alignment style from element
  const getAlignStyle = (el) => {
    const style = el.getAttribute('style') || '';
    const alignMatch = style.match(/text-align:\s*(\w+)/i);
    return alignMatch ? `style="text-align: ${alignMatch[1]}"` : '';
  };
  
  // Check for ul elements - preserve entire list with its class
  const lists = temp.querySelectorAll('ul');
  if (lists.length > 0) {
    lists.forEach(ul => {
      const bulletClass = ul.className || '';
      const listItems = ul.querySelectorAll('li');
      listItems.forEach(li => {
        const content = li.innerHTML.trim();
        const alignStyle = getAlignStyle(li);
        if (content && content !== '<br>') {
          // Wrap content with marker to indicate bullet type and alignment
          const bulletType = bulletClass.includes('bullet-hollow') ? 'hollow' : 'filled';
          if (alignStyle) {
            bullets.push(`<span data-bullet="${bulletType}" ${alignStyle}>${content}</span>`);
          } else {
            bullets.push(`<span data-bullet="${bulletType}">${content}</span>`);
          }
        }
      });
    });
  }
  
  // Check for paragraphs and divs (plain text)
  const paragraphs = temp.querySelectorAll('p, div:not(:has(ul)):not(:has(p))');
  paragraphs.forEach(el => {
    // Skip if inside a list
    if (el.closest('ul') || el.closest('li')) return;
    const content = el.innerHTML.trim();
    const alignStyle = getAlignStyle(el);
    if (content && content !== '<br>') {
      // Preserve alignment in a wrapper span
      if (alignStyle) {
        bullets.push(`<span ${alignStyle}>${content}</span>`);
      } else {
        bullets.push(content);
      }
    }
  });
  
  // If no block elements found, split by <br>
  if (bullets.length === 0) {
    const rawText = temp.innerHTML;
    const parts = rawText.split(/<br\s*\/?>/gi);
    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed) {
        bullets.push(trimmed);
      }
    });
  }
  
  return bullets.filter(b => b && b.trim());
};

export default function ExperienceEditor({ experiences = [], onChange }) {
  const [openIndex, setOpenIndex] = useState(null);
  const [rawBulletsHtml, setRawBulletsHtml] = useState('');
  const rawBulletsHtmlRef = useRef('');
  rawBulletsHtmlRef.current = rawBulletsHtml;
  const list = experiences;

  // Re-initialise rawBulletsHtml whenever the open entry changes, using ref to
  // avoid stale closures without triggering unnecessary resets while typing.
  const openBullets = openIndex !== null ? list[openIndex]?.bullets : null;
  useEffect(() => {
    if (openIndex === null) { setRawBulletsHtml(''); return; }
    const incoming = list[openIndex]?.bullets || [];
    // Compare parsed bullets to avoid unnecessary resets while typing
    const currentParsed = htmlToBullets(rawBulletsHtmlRef.current);
    if (JSON.stringify(currentParsed) !== JSON.stringify(incoming)) {
      setRawBulletsHtml(bulletsToHtml(incoming));
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
    setRawBulletsHtml('');
  };

  const removeEntry = (index) => {
    onChange(list.filter((_, i) => i !== index));
    setOpenIndex(null);
    setRawBulletsHtml('');
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

                  <RichTextEditor
                    id={`exp-bullets-${index}`}
                    label="Achievements & Responsibilities"
                    value={rawBulletsHtml}
                    onChange={(html) => { 
                      setRawBulletsHtml(html); 
                      updateAt(index, 'bullets', htmlToBullets(html)); 
                    }}
                    placeholder="Start typing your achievements here. Press Enter for new lines. Each paragraph will appear as a separate bullet point on your CV."
                    hint="Press Enter to start a new line. Use the toolbar for formatting (bold, italic, links). Each paragraph becomes a bullet point in your CV."
                    minHeight={140}
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
