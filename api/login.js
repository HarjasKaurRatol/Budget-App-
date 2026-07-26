const crypto = require("crypto");

const THIRTY_DAYS = 60 * 60 * 24 * 30;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }

  const password = (req.body && req.body.password) || "";
  const expected = process.env.SITE_PASSWORD || "";
  const secret = process.env.AUTH_SECRET || "";

  const passBuf = Buffer.from(password);
  const expectedBuf = Buffer.from(expected);
  const ok =
    Boolean(expected) &&
    Boolean(secret) &&
    passBuf.length === expectedBuf.length &&
    crypto.timingSafeEqual(passBuf, expectedBuf);

  if (!ok) {
    res.writeHead(302, { Location: "/login.html?error=1" });
    return res.end();
  }

  const expiry = Math.floor(Date.now() / 1000) + THIRTY_DAYS;
  const sig = crypto.createHmac("sha256", secret).update(String(expiry)).digest("hex");
  const token = `${expiry}.${sig}`;

  res.setHeader(
    "Set-Cookie",
    `app_auth=${token}; Path=/; Max-Age=${THIRTY_DAYS}; HttpOnly; Secure; SameSite=Lax`
  );
  res.writeHead(302, { Location: "/" });
  res.end();
};
