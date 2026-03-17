import {
  Document,
  Page,
  Text,
  View,
  Link,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

const LM_BASE = 'https://fonts.cdnfonts.com/s/266';
const FA_BASE =
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/webfonts';

Font.register({
  family: 'LMRoman',
  fonts: [
    { src: `${LM_BASE}/lmroman10-regular.woff` },
    { src: `${LM_BASE}/lmroman10-bold.woff`, fontWeight: 700 },
    { src: `${LM_BASE}/lmroman10-italic.woff`, fontStyle: 'italic' },
    {
      src: `${LM_BASE}/lmroman10-bolditalic.woff`,
      fontWeight: 700,
      fontStyle: 'italic',
    },
  ],
});

Font.register({ family: 'FA5Solid', src: `${FA_BASE}/fa-solid-900.woff` });
Font.register({ family: 'FA5Brands', src: `${FA_BASE}/fa-brands-400.woff` });
Font.register({ family: 'FA5Regular', src: `${FA_BASE}/fa-regular-400.woff` });

/* Font Awesome 5 unicode codepoints matching the HTML preview icons */
const CONTACT_ICONS = {
  address:      { char: '\uF3C5', font: 'FA5Solid' },
  phone:        { char: '\uF879', font: 'FA5Solid' },
  email:        { char: '\uF0E0', font: 'FA5Regular' },
  website:      { char: '\uF0AC', font: 'FA5Solid' },
  linkedin:     { char: '\uF08C', font: 'FA5Brands' },
  github:       { char: '\uF09B', font: 'FA5Brands' },
  googleScholar:{ char: '\uF501', font: 'FA5Solid' },
  portfolio:    { char: '\uF0B1', font: 'FA5Solid' },
};

function asHref(value) {
  if (!value) return '';
  if (value.includes('@')) return `mailto:${value}`;
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  return `https://${value}`;
}

/* Exact colors from the HTML preview */
const C = {
  text:      '#2d3748',  /* body color: var(--text-main) */
  gray:      '#7f7f7f',  /* --pdf-gray */
  sep:       '#666666',  /* .sep color */
  underline: '#6f6f6f',  /* .cv-section-title border */
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 33.08,
    paddingHorizontal: 30.19,
    paddingBottom: 48,
    fontFamily: 'LMRoman',
    fontSize: 9.96,
    lineHeight: 1.15,
    color: C.text,
  },
  updated: {
    position: 'absolute',
    top: 32,
    right: 30.19,
    fontFamily: 'LMRoman',
    fontSize: 8.97,
    color: C.gray,
    fontStyle: 'italic',
  },
  name: {
    fontFamily: 'LMRoman',
    fontWeight: 700,
    fontSize: 23.91,
    textAlign: 'center',
    marginTop: 12.85,
    marginBottom: 8.2,
    lineHeight: 1,
    color: C.text,
  },
  tagline: {
    fontFamily: 'LMRoman',
    fontSize: 9.96,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 2,
    color: C.text,
  },
  contactWrap: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 6.5,
    marginBottom: 10.95,
    alignItems: 'center',
  },
  contactLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 4,
  },
  contactSubline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 4.1,
    marginBottom: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  contactIcon: {
    fontSize: 7.97,
    color: C.text,
    lineHeight: 1,
    /* FA glyphs sit above their baseline; nudge down to match text */
    transform: 'translateY(1)',
  },
  contactSep: {
    marginHorizontal: 6,
    color: C.sep,
    fontSize: 9.96,
  },
  sectionWrap: {
    marginBottom: 5.5,
  },
  sectionTitleBox: {
    marginBottom: 4.25,
  },
  sectionTitle: {
    fontFamily: 'LMRoman',
    fontWeight: 700,
    fontSize: 11.96,
    color: C.text,
    marginBottom: 7,
  },
  /* height:1 + backgroundColor is the only 100% reliable 1-pt rule in react-pdf */
  sectionTitleUnderline: {
    height: 1,
    backgroundColor: C.underline,
  },
  paragraph: {
    fontFamily: 'LMRoman',
    fontSize: 9.96,
    margin: 0,
    textAlign: 'justify',
    color: C.text,
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  roleSubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontStyle: 'italic',
    fontSize: 8.96,
    marginBottom: 2,
    color: C.text,
  },
  roleTitle: {
    fontFamily: 'LMRoman',
    fontWeight: 700,
    fontSize: 9.96,
    color: C.text,
    flex: 1,
  },
  roleLocation: {
    fontStyle: 'italic',
    fontSize: 8.96,
    color: C.text,
    flexShrink: 0,
  },
  roleCompany: {
    fontFamily: 'LMRoman',
    fontStyle: 'italic',
    fontSize: 9.96,
    color: C.text,
    flex: 1,
  },
  roleDate: {
    fontStyle: 'italic',
    fontSize: 8.96,
    color: C.text,
    flexShrink: 0,
  },
  itemRow: {
    marginBottom: 1,
  },
  educationEntry: {
    marginBottom: 5,
  },
  highlightsEntry: {
    marginBottom: 5,
  },
  itemTitleLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 10,
  },
  itemTitle: {
    fontFamily: 'LMRoman',
    fontWeight: 700,
    fontSize: 9.96,
    color: C.text,
    flex: 1,
  },
  itemStatus: {
    fontFamily: 'LMRoman',
    fontStyle: 'italic',
    fontSize: 9.96,
    color: C.text,
    flexShrink: 0,
  },
  itemMeta: {
    fontFamily: 'LMRoman',
    fontSize: 9.96,
    marginTop: 1,
    color: C.text,
  },
  bullets: {
    marginLeft: 16,
    marginTop: 3,
    marginBottom: 4,
    fontSize: 9.96,
    color: C.text,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 1.5,
  },
  bulletMarker: {
    width: 10,
    fontSize: 9.96,
    color: C.text,
  },
  focusLine: {
    fontFamily: 'LMRoman',
    fontSize: 9.96,
    marginBottom: 6,
    color: C.text,
  },
  skillsLine: {
    fontFamily: 'LMRoman',
    fontSize: 9.96,
    marginBottom: 2,
    color: C.text,
  },
  certLine: {
    fontFamily: 'LMRoman',
    fontSize: 9.96,
    marginBottom: 2,
    color: C.text,
  },
  link: {
    fontFamily: 'LMRoman',
    fontSize: 9.96,
    color: C.text,
    textDecoration: 'none',
    textDecorationColor: C.text,
  },
});

function Section({ title, children }) {
  if (!children) return null;
  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionTitleBox}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.sectionTitleUnderline} />
      </View>
      {children}
    </View>
  );
}

export default function CVDocument({ data }) {
  const st = data?.sectionTitles || {};

  const contactLine1 = [
    { key: 'address', value: data?.address, link: false },
    { key: 'phone',   value: data?.phone,   link: false },
    { key: 'email',   value: data?.email,   link: true  },
  ].filter((x) => x.value);

  const contactLine2 = [
    { key: 'website',       value: data?.website,       link: true },
    { key: 'linkedin',      value: data?.linkedin,      link: true },
    { key: 'github',        value: data?.github,        link: true },
    { key: 'googleScholar', value: data?.googleScholar, link: true },
    { key: 'portfolio',     value: data?.portfolio,     link: true },
  ].filter((x) => x.value);

  const renderContactLine = (items) => {
    const els = [];
    items.forEach((item, i) => {
      if (i > 0) {
        els.push(
          <Text key={`sep-${i}`} style={styles.contactSep}>|</Text>
        );
      }
      const icon = CONTACT_ICONS[item.key];
      els.push(
        <View key={item.key} style={styles.contactItem}>
          {icon && (
            <Text style={[styles.contactIcon, { fontFamily: icon.font }]}>
              {icon.char}
            </Text>
          )}
          {item.link ? (
            <Link src={asHref(item.value)} style={styles.link}>
              {item.value}
            </Link>
          ) : (
            <Text style={{ fontSize: 9.96, color: C.text }}>{item.value}</Text>
          )}
        </View>
      );
    });
    return els;
  };

  const experiences = (data?.experiences || []).filter((e) => !e.hidden).map((e) => (
    <View key={`${e.role}-${e.company}`} style={styles.itemRow}>
      <View style={styles.roleRow}>
        <Text style={styles.roleTitle}>{e.role}</Text>
        {e.location ? <Text style={styles.roleLocation}>{e.location}</Text> : null}
      </View>
      <View style={styles.roleSubRow}>
        <Text style={styles.roleCompany}>{e.company || ' '}</Text>
        {e.dateRange ? <Text style={styles.roleDate}>{e.dateRange}</Text> : null}
      </View>
      {(e.bullets || []).length > 0 ? (
        <View style={styles.bullets}>
          {(e.bullets || []).map((b, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={styles.bulletMarker}>◦</Text>
              <Text style={{ color: C.text, flex: 1 }}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {e.focus ? (
        <Text style={styles.focusLine}>
          <Text style={{ fontFamily: 'LMRoman', fontWeight: 700 }}>Focus:</Text>
          {` ${e.focus}`}
        </Text>
      ) : null}
    </View>
  ));

  const education = (data?.education || []).filter((e) => !e.hidden).map((e) => (
    <View key={`${e.school}-${e.degree}`} style={[styles.itemRow, styles.educationEntry]}>
      <View style={styles.itemTitleLine}>
        <Text style={styles.itemTitle}>{e.school}</Text>
        <Text style={styles.itemStatus}>{e.dateRange}</Text>
      </View>
      <Text style={styles.itemMeta}>{e.degree}</Text>
      {e.gpa     ? <Text style={styles.itemMeta}>◦ GPA/CGPA: {e.gpa}</Text> : null}
      {e.advisor ? <Text style={styles.itemMeta}>◦ Advisor: {e.advisor}</Text> : null}
      {e.areas   ? <Text style={styles.itemMeta}>◦ Focused Areas: {e.areas}</Text> : null}
      {e.awards  ? <Text style={styles.itemMeta}>◦ Awards: {e.awards}</Text> : null}
    </View>
  ));

  const highlights = (data?.highlights || []).filter((r) => !r.hidden).map((r) => (
    <View key={r.title} style={[styles.itemRow, styles.highlightsEntry]}>
      <View style={styles.itemTitleLine}>
        <Text style={styles.itemTitle}>{r.title}</Text>
        <Text style={styles.itemStatus}>{r.status}</Text>
      </View>
      <Text style={styles.itemMeta}>{r.description}</Text>
      {r.linkUrl ? (
        <Text style={styles.itemMeta}>
          <Link src={r.linkUrl} style={styles.link}>
            {r.linkLabel || r.linkUrl}
          </Link>
        </Text>
      ) : null}
    </View>
  ));

  const projects = (data?.projects || []).filter((p) => !p.hidden).map((p) => (
    <View key={p.name} style={styles.itemRow}>
      <View style={styles.itemTitleLine}>
        <Text style={styles.itemTitle}>{p.name}</Text>
        {p.linkUrl ? (
          <Link src={p.linkUrl} style={styles.link}>
            {p.linkLabel || 'Repository'}
          </Link>
        ) : null}
      </View>
      {(p.bullets || []).length > 0 ? (
        <View style={styles.bullets}>
          {(p.bullets || []).map((b, i) => (
            <View key={i} style={styles.bulletItem}>
              <Text style={styles.bulletMarker}>◦</Text>
              <Text style={{ color: C.text, flex: 1 }}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  ));

  const books = (data?.books || []).map((b) => (
    <View key={b.title} style={styles.itemRow}>
      <View style={styles.itemTitleLine}>
        <Text style={styles.itemTitle}>{b.title}</Text>
        {b.linkUrl ? (
          <Link src={b.linkUrl} style={styles.link}>
            {b.linkLabel || 'Link'}
          </Link>
        ) : null}
      </View>
      {b.isbn        ? <Text style={styles.itemMeta}>{b.isbn}</Text>        : null}
      {b.description ? <Text style={styles.itemMeta}>{b.description}</Text> : null}
    </View>
  ));

  const technologies = (data?.technologies || '').trim() ? (
    <Text style={styles.skillsLine}>
      <Text style={{ fontFamily: 'LMRoman', fontWeight: 700 }}>Languages & Tools:</Text>
      {` ${data.technologies}`}
    </Text>
  ) : null;

  const certifications = (data?.certifications || []).map((c) => (
    <Text key={c} style={styles.certLine}>◦ {c}</Text>
  ));

  const volunteering = (data?.volunteering || []).map((v) => (
    <Text key={v} style={styles.certLine}>◦ {v}</Text>
  ));

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.updated}>
          Last updated in {data?.updatedLabel || ''}
        </Text>

        <Text style={styles.name}>{data?.name || ''}</Text>

        {data?.tagline ? (
          <Text style={styles.tagline}>{data.tagline}</Text>
        ) : null}

        <View style={styles.contactWrap}>
          <View style={styles.contactLine}>
            {renderContactLine(contactLine1)}
          </View>
          {contactLine2.length > 0 ? (
            <View style={styles.contactSubline}>
              {renderContactLine(contactLine2)}
            </View>
          ) : null}
        </View>

        <Section
          title={st.objective || 'Professional Profile'}
          children={data?.objective ? <Text style={styles.paragraph}>{data.objective}</Text> : null}
        />
        <Section
          title={st.interests || 'Technical Proficiencies'}
          children={data?.interests ? <Text style={styles.paragraph}>{data.interests}</Text> : null}
        />
        {data?.competencies ? (
          <Section
            title={st.competencies || 'Operational Expertise'}
            children={<Text style={styles.paragraph}>{data.competencies}</Text>}
          />
        ) : null}
        <Section
          title={st.experience || 'Professional Experience'}
          children={experiences.length ? experiences : null}
        />
        <Section
          title={st.education || 'Education'}
          children={education.length ? education : null}
        />
        <Section
          title={st.highlights || 'Key Achievements & Publications'}
          children={highlights.length ? highlights : null}
        />
        <Section
          title={st.projects || 'Project Portfolio'}
          children={projects.length ? projects : null}
        />
        <Section
          title={st.books || 'Whitepapers & Research'}
          children={books.length ? books : null}
        />
        <Section
          title={st.technologies || 'Core Tech Stack'}
          children={technologies}
        />
        <Section
          title={st.certifications || 'Professional Certifications'}
          children={certifications.length ? certifications : null}
        />
        <Section
          title={st.volunteering || 'Community & Affiliations'}
          children={volunteering.length ? volunteering : null}
        />
      </Page>
    </Document>
  );
}
