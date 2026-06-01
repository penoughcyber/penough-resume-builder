import { useRef, useEffect } from 'react';

export default function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  rows,
  required,
  optional,
  hint,
  icon,
}) {
  const inputId = id || `field-${String(label).replace(/\s+/g, '-').toLowerCase()}`;
  const hasValue = (value ?? '').toString().trim().length > 0;
  const areaRef = useRef(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 480) + 'px';
  }, [value]);

  return (
    <div className={`ff ${hasValue ? 'ff--filled' : ''} ${icon ? 'ff--has-icon' : ''}`}>
      <label htmlFor={inputId} className="ff__label">
        {label}
        {optional && <span className="ff__optional">Optional</span>}
        {required && <span className="ff__required">*</span>}
      </label>

      <div className="ff__control-wrap">
        {icon && (
          <span className="ff__icon">
            <i className={`fas ${icon}`} />
          </span>
        )}
        {rows ? (
          <textarea
            ref={areaRef}
            id={inputId}
            className="ff__control ff__control--area"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            required={required}
            aria-describedby={hint ? `${inputId}-hint` : undefined}
          />
        ) : (
          <input
            id={inputId}
            type={type}
            className="ff__control"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            aria-describedby={hint ? `${inputId}-hint` : undefined}
          />
        )}
        {hasValue && !rows && (
          <span className="ff__check">
            <i className="fas fa-check" />
          </span>
        )}
      </div>

      {hint && (
        <p id={`${inputId}-hint`} className="ff__hint">
          <i className="fas fa-info-circle" />
          {hint}
        </p>
      )}
    </div>
  );
}
