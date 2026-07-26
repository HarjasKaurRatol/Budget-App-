const crypto = require("crypto");

function sendError(res, status, message) {
  res.statusCode = status;
  return res.json({ error: { message } });
}

function isAuthed(req) {
  const secret = process.env.AUTH_SECRET || "";
  if (!secret) return false;

  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(/(?:^|;\s*)app_auth=([^;]+)/);
  if (!match) return false;

  const [expiry, sig] = decodeURIComponent(match[1]).split(".");
  if (!expiry || !sig) return false;
  if (Date.now() > Number(expiry) * 1000) return false;

  const expected = crypto.createHmac("sha256", secret).update(expiry).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const sigBuf = Buffer.from(sig);
  return expectedBuf.length === sigBuf.length && crypto.timingSafeEqual(expectedBuf, sigBuf);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return sendError(res, 405, "Method not allowed");
  }

  if (!isAuthed(req)) {
    return sendError(res, 401, "Not authenticated");
  }

  const { prompt, maxTokens } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return sendError(res, 400, "Missing prompt");
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return sendError(res, 500, "Server is missing ANTHROPIC_API_KEY");
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: Math.min(Number(maxTokens) || 300, 1000),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await anthropicRes.json();
    res.statusCode = anthropicRes.status;
    return res.json(data);
  } catch (err) {
    return sendError(res, 502, "Failed to reach Anthropic API");
  }
};
