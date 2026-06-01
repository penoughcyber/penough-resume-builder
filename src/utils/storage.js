const STORAGE_KEY = "pro_cv_builder_data_v1";
const SNAPSHOT_KEY = "pro_cv_builder_snapshot_v1";

export function loadState(sampleData) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(sampleData);
    const parsed = JSON.parse(raw);
    parsed.sectionTitles = {
      ...structuredClone(sampleData.sectionTitles),
      ...(parsed.sectionTitles || {}),
    };
    return { ...structuredClone(sampleData), ...parsed };
  } catch {
    return structuredClone(sampleData);
  }
}

export function saveState(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveSnapshot(data) {
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(data));
}

export function loadSnapshot() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSnapshot() {
  localStorage.removeItem(SNAPSHOT_KEY);
}

export function hasSnapshot() {
  return !!localStorage.getItem(SNAPSHOT_KEY);
}
