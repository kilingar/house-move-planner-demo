const { Redis } = require("@upstash/redis");

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

function sanitizeEnvValue(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function getRedisCredentials() {
  const rawUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const rawToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  const url = sanitizeEnvValue(rawUrl);
  const token = sanitizeEnvValue(rawToken);

  if (!url || !token) return null;
  return { url, token };
}

function getRedisClient() {
  const creds = getRedisCredentials();
  if (!creds) return null;

  return new Redis({
    url: creds.url,
    token: creds.token,
  });
}

module.exports = async function handler(req, res) {
  try {
    const redis = getRedisClient();
    if (!redis) {
      return res.status(503).json({
        error: "Redis is not configured for this deployment",
        detail: "Attach an Upstash Redis integration and set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN).",
      });
    }

    if (req.method === "GET") {
      const state = await redis.get(STORAGE_KEY);
      return res.status(200).json({ state: state || null });
    }

    if (req.method === "POST") {
      const payload = parseJsonBody(req);
      const state = normalizeChecklistState(payload && payload.state);
      await redis.set(STORAGE_KEY, state);
      return res.status(200).json({ ok: true, state });
    }

    res.setHeader("Allow", "GET,POST");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({
      error: "Redis operation failed",
      detail: error && error.message ? error.message : "unknown error",
    });
  }
};
