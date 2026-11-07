// The docs page loads Scalar from a CDN, so it needs a looser Content-Security-Policy than the API.
export const DOCS_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
  "font-src 'self' data: https:",
  "img-src 'self' data: https:",
  "connect-src 'self' https: http://localhost:* http://127.0.0.1:*",
].join('; ');

export const DOCS_LOGIN_HEADERS = { 'WWW-Authenticate': 'Basic realm="API docs (password = ADMIN_TOKEN)"' };
