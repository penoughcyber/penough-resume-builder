function parsePiped(text, minParts = 1) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("|").map((p) => p.trim()))
    .filter((parts) => parts.length >= minParts);
}

export function arrayFromText(text = "") {
  return text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function stringifyExperiences(exps = []) {
  return exps
    .map((e) => {
      const head = [e.role, e.company, e.location, e.dateRange, e.focus]
        .map((s) => s || "")
        .join(" | ");
      const bullets = (e.bullets || []).map((b) => `- ${b}`).join("\n");
      return `${head}\n${bullets}`.trim();
    })
    .join("\n\n");
}

export function parseExperiences(raw = "") {
  const blocks = raw.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const [role = "", company = "", location = "", dateRange = "", focus = ""] =
      (lines.shift() || "").split("|").map((x) => x.trim());
    const bullets = lines
      .map((l) => l.replace(/^[-•◦]\s*/, "").trim())
      .filter(Boolean);
    return { role, company, location, dateRange, focus, bullets };
  });
}

export function stringifyEducation(rows = []) {
  return rows
    .map((r) => [r.school, r.degree, r.dateRange, r.advisor, r.areas, r.awards || ""].join(" | "))
    .join("\n");
}

export function parseEducation(raw = "") {
  return parsePiped(raw, 3).map(
    ([school = "", degree = "", dateRange = "", advisor = "", areas = "", awards = ""]) => ({
      school,
      degree,
      dateRange,
      advisor,
      areas,
      awards,
    })
  );
}

export function stringifyHighlights(rows = []) {
  return rows
    .map((r) => [r.title, r.status, r.description, r.linkLabel, r.linkUrl].join(" | "))
    .join("\n");
}

export function parseHighlights(raw = "") {
  return parsePiped(raw, 3).map(
    ([title = "", status = "", description = "", linkLabel = "", linkUrl = ""]) => ({
      title,
      status,
      description,
      linkLabel,
      linkUrl,
    })
  );
}

export function stringifyProjects(rows = []) {
  return rows
    .map((r) => {
      const head = [r.name, r.linkLabel || "", r.linkUrl || ""].join(" | ");
      const bullets = (r.bullets || []).map((b) => `- ${b}`).join("\n");
      return [head, bullets].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

export function parseProjects(raw = "") {
  return raw.split(/\n\n+/).map((block) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const [name = "", linkLabel = "", linkUrl = ""] = (lines.shift() || "")
      .split("|")
      .map((x) => x.trim());
    const bullets = lines
      .map((l) => l.replace(/^[-•◦]\s*/, "").trim())
      .filter(Boolean);
    return { name, linkLabel, linkUrl, bullets };
  });
}

export function stringifyBooks(rows = []) {
  return rows
    .map((r) => [r.title, r.isbn, r.description, r.linkLabel, r.linkUrl].join(" | "))
    .join("\n");
}

export function parseBooks(raw = "") {
  return parsePiped(raw, 2).map(
    ([title = "", isbn = "", description = "", linkLabel = "", linkUrl = ""]) => ({
      title,
      isbn,
      description,
      linkLabel,
      linkUrl,
    })
  );
}
