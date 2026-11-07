// Firestore through firebase-admin. Credentials:
//  - FIREBASE_SERVICE_ACCOUNT = the service-account JSON on one line (Vercel, any host), or
//  - GOOGLE_CLOUD_PROJECT=<id>, when running on Google Cloud or after `gcloud auth application-default login`.
// Never commit the JSON file.
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { AppError } from '__SCOPE__/shared';
import { env } from '../config/env';

let cached: Firestore | undefined;

export function db(): Firestore {
  if (cached) return cached;
  // Without credentials firebase-admin would hang looking for them: fail fast with a clear message.
  if (!env.FIREBASE_SERVICE_ACCOUNT && !process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.GOOGLE_CLOUD_PROJECT) {
    throw new AppError('INTERNAL', 'Firestore: set FIREBASE_SERVICE_ACCOUNT (service-account JSON on one line)');
  }
  const app = getApps()[0] ?? initializeApp(env.FIREBASE_SERVICE_ACCOUNT ? { credential: cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)) } : undefined);
  cached = getFirestore(app);
  return cached;
}
