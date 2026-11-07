// MongoDB through mongoose. MONGODB_URI: local `mongodb://127.0.0.1:27017/<name>` (docker compose up -d)
// or a MongoDB Atlas connection string in production.
// One connection is reused across requests (and across serverless invocations while warm).
import mongoose from 'mongoose';
import { AppError } from '__SCOPE__/shared';
import { env } from '../config/env';

let connecting: Promise<typeof mongoose> | undefined;

export async function connectDb() {
  if (!env.MONGODB_URI) throw new AppError('INTERNAL', 'MONGODB_URI is not set');
  connecting ??= mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 }).catch((e) => {
    connecting = undefined; // try again on the next request
    throw e;
  });
  return connecting;
}
