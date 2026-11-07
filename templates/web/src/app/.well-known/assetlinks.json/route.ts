import { connection } from 'next/server';
import { app } from '__SCOPE__/config';

// Android App Links: lets https://<your domain>/... open the app directly (no "open with" prompt).
// ANDROID_SHA256_FINGERPRINTS = comma-separated SHA-256 signing fingerprints. Find them in
// Play Console -> Test and release -> App integrity -> App signing (use the "App signing key" one).
export async function GET() {
  await connection(); // read the env vars per request, not once at build time
  const fingerprints = (process.env.ANDROID_SHA256_FINGERPRINTS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return Response.json([
    { relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: app.packageId, sha256_cert_fingerprints: fingerprints } },
  ]);
}
