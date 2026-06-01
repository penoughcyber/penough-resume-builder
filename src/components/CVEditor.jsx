import { useState, useEffect, useRef } from 'react';
import FormSection from './FormSection';
import FormField from './FormField';
import ExperienceEditor from './ExperienceEditor';
import EducationEditor from './EducationEditor';
import HighlightsEditor from './HighlightsEditor';
import ProjectsEditor from './ProjectsEditor';
import FileUploader from './FileUploader';
import { MergePreviewModal } from './MergePreview';
import {
  parseBooks,
  arrayFromText,
  stringifyBooks,
} from '../utils/parsers';
import { sectionTitlesDefault } from '../data/sampleData';

const SECTIONS = [
  'Personal Essentials',
  'Professional Narrative',
  'Professional Experience',
  'Education',
  'Research & Publications',
  'Projects',
  'Skills & Affiliations',
  'Custom Section Titles',
];

const PLACEHOLDERS = {
  name: 'John Doe',
  tagline: 'e.g. Senior Software Engineer | Security Analyst',
  address: 'City, Country',
  email: 'you@email.com',
  phone: '+1 234 567 8900',
  website: 'yoursite.com or portfolio.example.com',
  linkedin: 'linkedin.com/in/username',
  github: 'github.com/username',
  googleScholar: 'scholar.google.com/citations?user=...',
  portfolio: 'e.g. personal website or project link',
  updatedLabel: 'e.g. March 2026',
};

export default function CVEditor({ data, onDataChange }) {
  const [openSection, setOpenSection] = useState(SECTIONS[0]);
  const [isImportResumeOpen, setIsImportResumeOpen] = useState(false);
  const st = data.sectionTitles;

  // File upload states
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [showMergePreview, setShowMergePreview] = useState(false);
  const [mergeConflicts, setMergeConflicts] = useState([]);

  // Local raw-text state keeps trailing newlines alive while typing.
  // Refs mirror the state so useEffect never reads a stale closure value.
  const [certsRaw, setCertsRaw] = useState(() => (data.certifications || []).join('\n'));
  const [volRaw, setVolRaw]     = useState(() => (data.volunteering  || []).join('\n'));
  const [booksRaw, setBooksRaw] = useState(() => stringifyBooks(data.books || []));
  const certsRawRef = useRef(certsRaw);
  const volRawRef   = useRef(volRaw);
  const booksRawRef = useRef(booksRaw);
  certsRawRef.current = certsRaw;
  volRawRef.current   = volRaw;
  booksRawRef.current = booksRaw;

  // Only sync when an external action (Demo / Import / Clear) changes the array
  // to content different from what the current raw text already represents.
  useEffect(() => {
    const incoming = data.certifications || [];
    if (JSON.stringify(arrayFromText(certsRawRef.current)) !== JSON.stringify(incoming)) {
      setCertsRaw(incoming.join('\n'));
    }
  }, [data.certifications]);

  useEffect(() => {
    const incoming = data.volunteering || [];
    if (JSON.stringify(arrayFromText(volRawRef.current)) !== JSON.stringify(incoming)) {
      setVolRaw(incoming.join('\n'));
    }
  }, [data.volunteering]);

  useEffect(() => {
    const incoming = data.books || [];
    const currentParsed = parseBooks(booksRawRef.current);
    if (JSON.stringify(currentParsed) !== JSON.stringify(incoming)) {
      setBooksRaw(stringifyBooks(incoming));
    }
  }, [data.books]);

  const toggle = (title) =>
    setOpenSection((prev) => (prev === title ? null : title));

  const handleChange = (field, value) => {
    const next = { ...data, [field]: value };
    onDataChange(next);
  };

  const handleNested = (field, subField, value) => {
    const next = {
      ...data,
      sectionTitles: { ...data.sectionTitles, [subField]: value },
    };
    if (field !== 'sectionTitles') {
      next[field] = value;
    }
    onDataChange(next);
  };

  const handleExperiences = (experiences) => {
    onDataChange({ ...data, experiences });
  };

  const handleEducation = (education) => {
    onDataChange({ ...data, education });
  };

  const handleHighlights = (highlights) => {
    onDataChange({ ...data, highlights });
  };

  const handleProjects = (projects) => {
    onDataChange({ ...data, projects });
  };

  const handleBooks = (raw) => {
    setBooksRaw(raw);
    const books = parseBooks(raw);
    onDataChange({ ...data, books });
  };

  const handleCertifications = (raw) => {
    setCertsRaw(raw);
    onDataChange({ ...data, certifications: arrayFromText(raw) });
  };

  const handleVolunteering = (raw) => {
    setVolRaw(raw);
    onDataChange({ ...data, volunteering: arrayFromText(raw) });
  };

  const textField = (key, label, optional) => (
    <FormField
      key={key}
      id={key}
      label={label}
      value={data[key]}
      onChange={(v) => handleChange(key, v)}
      placeholder={PLACEHOLDERS[key]}
      optional={optional}
    />
  );

  const areaField = (key, label, value, onChange, placeholder, hint) => (
    <FormField
      key={key}
      id={key}
      label={label}
      value={value}
      onChange={onChange}
      rows={6}
      placeholder={placeholder}
      hint={hint}
    />
  );

  const stField = (stKey) => {
    const defaultLabel = sectionTitlesDefault[stKey] || stKey;
    return (
      <FormField
        key={stKey}
        id={stKey}
        label={defaultLabel}
        value={st[stKey]}
        onChange={(v) => handleNested('sectionTitles', stKey, v)}
        placeholder={defaultLabel}
      />
    );
  };

  const handleFileExtracted = async (extractionResult) => {
    console.log('Extracted data:', extractionResult);
    if (!extractionResult || !extractionResult.extracted_data) {
      alert('Extraction failed: Invalid result');
      return;
    }
    try {
      // Store extracted data and open merge preview so user can choose what to overwrite.
      const extracted = extractionResult.extracted_data;
      setExtractedData(extracted);

      // Ask backend to detect conflicts against current data
      const response = await fetch('/api/ai/validate-and-merge/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          extracted_data: extracted,
          current_data: data,
          merge_choices: {},
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Conflict check failed (${response.status}): ${errorText.slice(0, 200)}`);
      }
      const result = await response.json();
      setMergeConflicts(result.conflicts || []);
      setShowMergePreview(true);
    } catch (err) {
      console.error('Error:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleMergeApply = async (mergeChoices) => {
    if (!extractedData) return;

    try {
      console.log('🔄 CVEditor: Starting merge with choices:', mergeChoices);
      
      const requestBody = {
        extracted_data: extractedData,
        current_data: data,
        merge_choices: mergeChoices,
        raw_text: '',
      };
      console.log('📤 CVEditor: Sending merge request:', requestBody);
      
      const response = await fetch('/api/ai/validate-and-merge/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('📬 CVEditor: Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ CVEditor: Backend error:', errorText);
        throw new Error(`Merge failed (${response.status}): ${errorText.slice(0, 200)}`);
      }

      const result = await response.json();
      console.log('✅ CVEditor: Merge result:', result);
      const mergedData = result.validated_data;

      // Apply to CV
      onDataChange(mergedData);
      setShowMergePreview(false);
      setExtractedData(null);
      setMergeConflicts([]);
      
      alert('✓ Resume imported and merged successfully!');
    } catch (err) {
      alert(`Merge error: ${err.message}`);
    }
  };

  return (
    <form className="editor-form" onSubmit={(e) => e.preventDefault()}>
      {/* Import Resume Section - Separate State */}
      <FormSection 
        title="📥 Import Resume from File" 
        isOpen={isImportResumeOpen} 
        onToggle={() => {
          console.log('Toggling Import Resume section');
          setIsImportResumeOpen(!isImportResumeOpen);
        }}
      >
        <p className="muted" style={{ marginBottom: 14 }}>
          Upload a PDF, Word document, or image of your resume. AI will extract the data and fill in your CV.
        </p>
        <FileUploader
          onExtracted={handleFileExtracted}
          onLoading={setIsUploading}
          compact={false}
        />
      </FormSection>
      <FormSection title="Personal Essentials" isOpen={openSection === 'Personal Essentials'} onToggle={() => toggle('Personal Essentials')}>
        {textField('name', 'Full Name')}
        {textField('tagline', 'Tagline / Professional Title')}
        {textField('address', 'Location (City, Country)')}
        {textField('email', 'Email Address')}
        {textField('phone', 'Phone Number')}

        <div className="link-field-group">
          {textField('website', 'Work Website', true)}
          <FormField id="websiteLabel" label="Display Text" value={data.websiteLabel} onChange={(v) => handleChange('websiteLabel', v)} placeholder="e.g. My Website" optional />
        </div>
        <div className="link-field-group">
          {textField('linkedin', 'LinkedIn Profile', true)}
          <FormField id="linkedinLabel" label="Display Text" value={data.linkedinLabel} onChange={(v) => handleChange('linkedinLabel', v)} placeholder="e.g. Ashfaq Hossain" optional />
        </div>
        <div className="link-field-group">
          {textField('github', 'GitHub', true)}
          <FormField id="githubLabel" label="Display Text" value={data.githubLabel} onChange={(v) => handleChange('githubLabel', v)} placeholder="e.g. ashfaq-dev" optional />
        </div>
        <div className="link-field-group">
          {textField('googleScholar', 'Google Scholar', true)}
          <FormField id="googleScholarLabel" label="Display Text" value={data.googleScholarLabel} onChange={(v) => handleChange('googleScholarLabel', v)} placeholder="e.g. Scholar Profile" optional />
        </div>
        <div className="link-field-group">
          {textField('portfolio', 'Additional Link', true)}
          <FormField id="portfolioLabel" label="Display Text" value={data.portfolioLabel} onChange={(v) => handleChange('portfolioLabel', v)} placeholder="e.g. Portfolio" optional />
        </div>

        {textField('updatedLabel', 'Revision Date')}
      </FormSection>

      <FormSection title="Professional Narrative" isOpen={openSection === 'Professional Narrative'} onToggle={() => toggle('Professional Narrative')}>
        {areaField(
          'objective',
          st.objective || sectionTitlesDefault.objective,
          data.objective ?? '',
          (v) => handleChange('objective', v),
          '2–4 sentences highlighting your expertise and value proposition...'
        )}
        {areaField(
          'interests',
          st.interests || sectionTitlesDefault.interests,
          data.interests ?? '',
          (v) => handleChange('interests', v),
          'e.g. Threat Hunting, SIEM, Cloud Security, Incident Response (use **bold** to highlight words)'
        )}
        {areaField(
          'competencies',
          st.competencies || sectionTitlesDefault.competencies,
          data.competencies ?? '',
          (v) => handleChange('competencies', v),
          'e.g. KQL, Python, Splunk, MITRE ATT&CK'
        )}
      </FormSection>

      <FormSection title="Professional Experience" isOpen={openSection === 'Professional Experience'} onToggle={() => toggle('Professional Experience')}>
        <ExperienceEditor
          experiences={data.experiences || []}
          onChange={handleExperiences}
        />
      </FormSection>

      <FormSection title="Education" isOpen={openSection === 'Education'} onToggle={() => toggle('Education')}>
        <EducationEditor
          education={data.education || []}
          onChange={handleEducation}
        />
      </FormSection>

      <FormSection title="Research & Publications" isOpen={openSection === 'Research & Publications'} onToggle={() => toggle('Research & Publications')}>
        <HighlightsEditor
          highlights={data.highlights || []}
          onChange={handleHighlights}
        />
        <hr className="form-divider" />
        {areaField(
          'booksRaw',
          'Publications / Books',
          booksRaw,
          handleBooks,
          'Title | ISBN | Description | Link Label | Link URL',
          'Format: Title | ISBN | Description | Link Text | Link URL (one book per line)'
        )}
      </FormSection>

      <FormSection title="Projects" isOpen={openSection === 'Projects'} onToggle={() => toggle('Projects')}>
        <ProjectsEditor
          projects={data.projects || []}
          onChange={handleProjects}
        />
      </FormSection>

      <FormSection title="Skills & Affiliations" isOpen={openSection === 'Skills & Affiliations'} onToggle={() => toggle('Skills & Affiliations')}>
        {areaField(
          'technologies',
          st.technologies || sectionTitlesDefault.technologies,
          data.technologies ?? '',
          (v) => handleChange('technologies', v),
          'Comma-separated: e.g. Python, Splunk, AWS, Terraform'
        )}
        {areaField(
          'certificationsRaw',
          st.certifications || sectionTitlesDefault.certifications,
          certsRaw,
          handleCertifications,
          'One certification per line',
          'Each line becomes a separate certification entry'
        )}
        {areaField(
          'volunteeringRaw',
          st.volunteering || sectionTitlesDefault.volunteering,
          volRaw,
          handleVolunteering,
          'One entry per line'
        )}
      </FormSection>

      <FormSection title="Custom Section Titles" isOpen={openSection === 'Custom Section Titles'} onToggle={() => toggle('Custom Section Titles')}>
        <p className="muted" style={{ marginBottom: 14 }}>
          Customize section headings to match your preview. Leave blank to use the default.
        </p>
        {stField('objective')}
        {stField('interests')}
        {stField('competencies')}
        {stField('experience')}
        {stField('education')}
        {stField('highlights')}
        {stField('projects')}
        {stField('books')}
        {stField('technologies')}
        {stField('certifications')}
        {stField('volunteering')}
      </FormSection>

      {/* Merge Preview Modal */}
      <MergePreviewModal
        isOpen={showMergePreview && !!extractedData}
        onClose={() => setShowMergePreview(false)}
        extractedData={extractedData}
        currentData={data}
        conflicts={mergeConflicts}
        onMergeComplete={handleMergeApply}
        isLoading={isUploading}
      />
    </form>
  );
}
