import { connection } from 'next/server';
import { app } from '__SCOPE__/config';

// iOS Universal Links. APPLE_TEAM_ID = your 10-character Apple Developer team id.
export async function GET() {
  await connection(); // read the env vars per request, not once at build time
  const team = process.env.APPLE_TEAM_ID;
  return Response.json({ applinks: { details: team ? [{ appIDs: [`${team}.${app.packageId}`], components: [{ '/': '/*' }] }] : [] } });
}
