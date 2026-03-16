const { kv } = require("@vercel/kv");

const STORAGE_KEY = process.env.CHECKLIST_STORAGE_KEY || "house-project-checklist-v1";
const CHECKLIST_VERSION = 3;

function normalizeChecklistState(rawState) {
  const parsed = rawState && typeof rawState === "object" ? rawState : {};

  if (parsed.version !== CHECKLIST_VERSION || !parsed.room || typeof parsed.room !== "object") {
    return { version: CHECKLIST_VERSION, room: {}, legacy: {}, updatedAt: 0 };
  }

  return {
    version: CHECKLIST_VERSION,
    room: parsed.room,
    legacy: parsed.legacy && typeof parsed.legacy === "object" ? parsed.legacy : {},
    updatedAt: Number.isFinite(parsed.updatedAt) ? parsed.updatedAt : Date.now(),
  };
}

function parseJsonBody(req) {
  if (!req.body) return null;
  if (typeof req.body === "object") return req.body;

  try {
    return JSON.parse(req.body);
  } catch (error) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const state = await kv.get(STORAGE_KEY);
      return res.status(200).json({ state: state || null });
    }

    if (req.method === "POST") {
      const payload = parseJsonBody(req);
      const state = normalizeChecklistState(payload && payload.state);
      await kv.set(STORAGE_KEY, state);
      return res.status(200).json({ ok: true, state });
    }

    res.setHeader("Allow", "GET,POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({
      error: "KV operation failed",
      detail: error && error.message ? error.message : "unknown error",
    });
  }
};
