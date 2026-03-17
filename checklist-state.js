function normalizeChecklistState(rawState, version) {
  const parsed = rawState && typeof rawState === "object" ? rawState : {};

  if (parsed.version !== version || !parsed.room || typeof parsed.room !== "object") {
    return { version: version, room: {}, legacy: {}, notes: {}, updatedAt: 0 };
  }

  return {
    version: version,
    room: parsed.room,
    legacy: parsed.legacy && typeof parsed.legacy === "object" ? parsed.legacy : {},
    notes: parsed.notes && typeof parsed.notes === "object" ? parsed.notes : {},
    updatedAt: Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : 0,
  };
}

function loadChecklistState(storageKey, version) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return normalizeChecklistState(null, version);
    }

    return normalizeChecklistState(JSON.parse(raw), version);
  } catch (error) {
    return normalizeChecklistState(null, version);
  }
}

function isChecklistStateEmpty(state) {
  const room = state && state.room && typeof state.room === "object" ? state.room : {};
  const legacy = state && state.legacy && typeof state.legacy === "object" ? state.legacy : {};
  const notes = state && state.notes && typeof state.notes === "object" ? state.notes : {};
  return Object.keys(room).length === 0 && Object.keys(legacy).length === 0 && Object.keys(notes).length === 0;
}

export { normalizeChecklistState, loadChecklistState, isChecklistStateEmpty };
