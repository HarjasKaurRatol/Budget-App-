module.exports = async (req, res) => {
  res.setHeader("Set-Cookie", "app_auth=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax");
  res.writeHead(302, { Location: "/login.html" });
  res.end();
};
