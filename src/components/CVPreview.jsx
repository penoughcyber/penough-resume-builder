function esc(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const CONTACT_ICONS = {
  address: 'fas fa-map-marker-alt',
  phone: 'fas fa-phone-alt',
  email: 'far fa-envelope',
  website: 'fas fa-globe',
  linkedin: 'fab fa-linkedin',
  github: 'fab fa-github',
  googleScholar: 'fas fa-user-graduate',
  portfolio: 'fas fa-briefcase',
};

function asHref(value) {
  if (!value) return '';
  if (value.includes('@')) return `mailto:${value}`;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://${value}`;
}

function isDataEmpty(data) {
  if (!data) return true;
  const hasText = (s) => typeof s === 'string' && s.trim().length > 0;
  return (
    !hasText(data.name) &&
    !hasText(data.tagline) &&
    !hasText(data.objective) &&
    !hasText(data.interests) &&
    !hasText(data.competencies) &&
    !(data.experiences?.filter((e) => e.role).length) &&
    !(data.education?.filter((e) => e.school).length) &&
    !(data.highlights?.filter((e) => e.title).length) &&
    !(data.projects?.filter((e) => e.name).length)
  );
}

import { useRef, useEffect, useState } from 'react';

export default function CVPreview({ data }) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setScale(Math.min(1, w / 820));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (isDataEmpty(data)) {
    return (
      <div className="cv-preview-html cv-preview--empty">
        <div className="cv-empty-state">
          <div className="cv-empty-state__icon">
            <i className="fas fa-file-alt" />
          </div>
          <h3 className="cv-empty-state__heading">Your CV preview appears here</h3>
          <p className="cv-empty-state__sub">
            Start filling in the fields on the left and watch your professional CV build in real time.
          </p>
          <ul className="cv-empty-state__tips">
            <li><i className="fas fa-user" /><span>Add your name and contact info first</span></li>
            <li><i className="fas fa-briefcase" /><span>Fill in your work experience</span></li>
            <li><i className="fas fa-graduation-cap" /><span>Add your education background</span></li>
            <li><i className="fas fa-magic" /><span>Try the Demo button to see a sample CV</span></li>
          </ul>
        </div>
      </div>
    );
  }

  const st = data?.sectionTitles || {};

  const contactLine1 = [
    { key: 'address', value: data?.address, link: false },
    { key: 'phone', value: data?.phone, link: false },
    { key: 'email', value: data?.email, link: true },
  ].filter((x) => x.value);

  const LINK_DEFAULTS = {
    website: 'Website', linkedin: 'LinkedIn', github: 'GitHub',
    googleScholar: 'Google Scholar', portfolio: 'Portfolio',
  };

  const contactLine2 = [
    { key: 'website',       value: data?.website,       displayLabel: data?.websiteLabel       || LINK_DEFAULTS.website,       link: true },
    { key: 'linkedin',      value: data?.linkedin,      displayLabel: data?.linkedinLabel      || LINK_DEFAULTS.linkedin,      link: true },
    { key: 'github',        value: data?.github,        displayLabel: data?.githubLabel        || LINK_DEFAULTS.github,        link: true },
    { key: 'googleScholar', value: data?.googleScholar, displayLabel: data?.googleScholarLabel || LINK_DEFAULTS.googleScholar, link: true },
    { key: 'portfolio',     value: data?.portfolio,     displayLabel: data?.portfolioLabel     || LINK_DEFAULTS.portfolio,     link: true },
  ].filter((x) => x.value);

  const buildContactHtml = (items) =>
    items
      .map((x) => {
        const iconClass = CONTACT_ICONS[x.key] || 'fas fa-circle';
        const icon = `<i class="${iconClass} cv-contact-icon" aria-hidden="true"></i>`;
        const srLabel = x.key.charAt(0).toUpperCase() + x.key.slice(1);
        const content = x.link
          ? `<a href="${esc(asHref(x.value))}" target="_blank" rel="noreferrer"><span class="sr-only">${srLabel}: </span>${esc(x.displayLabel || x.value)}</a>`
          : `<span class="sr-only">${srLabel}: </span>${esc(x.value)}`;
        return `<span class="cv-contact-item">${icon}${content}</span>`;
      })
      .join('<span class="sep">|</span>');

  const section = (title, body) =>
    body
      ? `<section class="cv-section"><h2 class="cv-section-title">${esc(title)}</h2>${body}</section>`
      : '';

  const experiences = (data?.experiences || []).filter((e) => !e.hidden)
    .map(
      (e) => `
      <article class="item-row">
        <div class="role-row">
          <h3 class="role-title">${esc(e.role)}</h3>
          ${e.location ? `<div class="role-location">${esc(e.location)}</div>` : ''}
        </div>
        <div class="role-row role-sub-row">
          ${e.company ? `<div class="role-company">${esc(e.company)}</div>` : '<div></div>'}
          ${e.dateRange ? `<div class="role-date">${esc(e.dateRange)}</div>` : ''}
        </div>
        ${(e.bullets || []).length ? `<ul class="bullets">${(e.bullets || []).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
        ${e.focus ? `<p class="focus-line"><strong>Focus:</strong> ${esc(e.focus)}</p>` : ''}
      </article>`
    )
    .join('');

  const education = (data?.education || []).filter((e) => !e.hidden)
    .map(
      (e) => `
      <article class="item-row">
        <div class="item-title-line">
          <h3 class="item-title">${esc(e.school)}</h3>
          <span class="item-status">${esc(e.dateRange)}</span>
        </div>
        <div class="item-meta">${esc(e.degree)}</div>
        ${e.gpa ? `<div class="item-meta">◦ GPA/CGPA: ${esc(e.gpa)}</div>` : ''}
        ${e.advisor ? `<div class="item-meta">◦ Advisor: ${esc(e.advisor)}</div>` : ''}
        ${e.areas ? `<div class="item-meta">◦ Focused Areas: ${esc(e.areas)}</div>` : ''}
        ${e.awards ? `<div class="item-meta">◦ Awards: ${esc(e.awards)}</div>` : ''}
      </article>`
    )
    .join('');

  const highlights = (data?.highlights || []).filter((r) => !r.hidden)
    .map(
      (r) => `
      <article class="item-row">
        <div class="item-title-line">
          <h3 class="item-title">${esc(r.title)}</h3>
          <span class="item-status">${esc(r.status)}</span>
        </div>
        <div class="item-meta">${esc(r.description)}</div>
        ${r.linkUrl ? `<div class="item-meta"><a class="link" href="${esc(r.linkUrl)}" target="_blank" rel="noreferrer">${esc(r.linkLabel || r.linkUrl)}</a></div>` : ''}
      </article>`
    )
    .join('');

  const projects = (data?.projects || []).filter((p) => !p.hidden)
    .map(
      (p) => `
      <article class="item-row">
        <div class="item-title-line">
          <h3 class="item-title">${esc(p.name)}</h3>
          ${p.linkUrl ? `<a class="link" href="${esc(p.linkUrl)}" target="_blank" rel="noreferrer">${esc(p.linkLabel || 'Repository')}</a>` : ''}
        </div>
        ${(p.bullets || []).length ? `<ul class="bullets">${(p.bullets || []).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
      </article>`
    )
    .join('');

  const books = (data?.books || [])
    .map(
      (b) => `
      <article class="item-row">
        <div class="item-title-line">
          <h3 class="item-title">${esc(b.title)}</h3>
          ${b.linkUrl ? `<a class="link" href="${esc(b.linkUrl)}" target="_blank" rel="noreferrer">${esc(b.linkLabel || 'Link')}</a>` : ''}
        </div>
        ${b.isbn ? `<div class="item-meta">${esc(b.isbn)}</div>` : ''}
        ${b.description ? `<div class="item-meta">${esc(b.description)}</div>` : ''}
      </article>`
    )
    .join('');

  const technologies = (data?.technologies || '').trim()
    ? `<div class="skills-line"><strong>Languages &amp; Tools:</strong> ${esc(data.technologies)}</div>`
    : '';

  const certifications = (data?.certifications || [])
    .map((c) => `<div class="cert-line">◦ ${esc(c)}</div>`)
    .join('');

  const volunteering = (data?.volunteering || [])
    .map((v) => `<div class="cert-line">◦ ${esc(v)}</div>`)
    .join('');

  const html = `
    <div class="cv-page">
      <div class="cv-updated-top">Last updated in ${esc(data?.updatedLabel || '')}</div>
      <header>
        <h1 class="cv-name">${esc(data?.name || '')}</h1>
        ${data?.tagline ? `<div class="cv-tagline">${esc(data.tagline)}</div>` : ''}
        <address class="cv-contact">
          <div class="cv-contact-line">${buildContactHtml(contactLine1)}</div>
          ${contactLine2.length ? `<div class="cv-contact-line cv-contact-subline">${buildContactHtml(contactLine2)}</div>` : ''}
        </address>
      </header>
      <main>
        ${section(st.objective || 'Professional Profile', data?.objective ? `<div class="cv-paragraph">${esc(data.objective)}</div>` : '')}
        ${section(st.interests || 'Technical Proficiencies', data?.interests ? `<div class="cv-paragraph">${esc(data.interests)}</div>` : '')}
        ${data?.competencies ? section(st.competencies || 'Operational Expertise', `<div class="cv-paragraph">${esc(data.competencies)}</div>`) : ''}
        ${section(st.experience || 'Professional Experience', experiences)}
        ${section(st.education || 'Education', education)}
        ${section(st.highlights || 'Key Achievements & Publications', highlights)}
        ${section(st.projects || 'Project Portfolio', projects)}
        ${section(st.books || 'Whitepapers & Research', books)}
        ${section(st.technologies || 'Core Tech Stack', technologies)}
        ${section(st.certifications || 'Professional Certifications', certifications)}
        ${section(st.volunteering || 'Community & Affiliations', volunteering)}
      </main>
    </div>
  `;

  return (
    <div ref={wrapRef} className="cv-preview-html">
      <div
        style={{ zoom: scale }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
