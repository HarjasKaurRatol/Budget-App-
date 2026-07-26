const PUBLIC_PATHS = new Set(["/login.html", "/api/login", "/api/logout"]);

async function isValidToken(token, secret) {
  if (!token) return false;
  const [expiry, sig] = token.split(".");
  if (!expiry || !sig) return false;
  if (Date.now() > Number(expiry) * 1000) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(expiry));
  const expectedHex = [...new Uint8Array(sigBuf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return expectedHex === sig;
}

export default async function middleware(request) {
  const { pathname } = new URL(request.url);
  if (PUBLIC_PATHS.has(pathname)) return;

  const secret = process.env.AUTH_SECRET;
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)app_auth=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;

  if (secret && (await isValidToken(token, secret))) {
    return;
  }

  return Response.redirect(new URL("/login.html", request.url), 302);
}
