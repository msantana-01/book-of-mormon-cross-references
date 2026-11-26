export const BOOKMARKS_STORAGE_KEY = "app_bookmarks";
export const BOOKMARK_META_STORAGE_KEY = "app_bookmark_meta_v1";
export const STUDY_TRAIL_STORAGE_KEY = "bom_study_trail_v1";
export const MAX_STUDY_TRAIL = 20;

export function parseBookmarkIds(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!storage) return [];
  try {
    const arr = JSON.parse(storage.getItem(BOOKMARKS_STORAGE_KEY) || "[]");
    return Array.isArray(arr) ? arr.filter(id => Number.isInteger(id) && id >= 1 && id <= 6604) : [];
  } catch {
    return [];
  }
}

export function readBookmarkMetaMap(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!storage) return {};
  try {
    const parsed = JSON.parse(storage.getItem(BOOKMARK_META_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function extractVerseMeta(verseId, map) {
  const entry = map?.[String(verseId)];
  return {
    folder: entry?.folder || "general",
    note: typeof entry?.note === "string" ? entry.note : ""
  };
}

export function updateVerseMeta(verseId, patch, storage = typeof localStorage !== "undefined" ? localStorage : null) {
  const map = readBookmarkMetaMap(storage);
  map[String(verseId)] = { ...extractVerseMeta(verseId, map), ...patch };
  if (storage) {
    try {
      storage.setItem(BOOKMARK_META_STORAGE_KEY, JSON.stringify(map));
    } catch {}
  }
  return map;
}

export function pushTrailStep(state, verseId, maxLen = MAX_STUDY_TRAIL) {
  if (state.trailIndex >= 0 && state.studyTrail[state.trailIndex]?.verseId === verseId) {
    return state;
  }
  const sliced = state.studyTrail.slice(0, state.trailIndex + 1);
  sliced.push({ verseId });
  if (sliced.length > maxLen) sliced.shift();
  return {
    studyTrail: sliced,
    trailIndex: sliced.length - 1,
    activeGuidedTrail: null
  };
}

export function getActiveGuidedStep(activeGuidedTrail, studyTrail, trailIndex) {
  if (!activeGuidedTrail || studyTrail.length < 2) return null;
  const curVerseId = studyTrail[trailIndex]?.verseId;
  const stepIdx = activeGuidedTrail.steps.findIndex(s => s.verseId === curVerseId);
  if (stepIdx === -1) return null;
  return { stepIdx, step: activeGuidedTrail.steps[stepIdx] };
}
