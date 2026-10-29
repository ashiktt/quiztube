import mongoose from 'mongoose';

/**
 * Sanitizes a MongoDB connection URI to mask credentials for safe logging.
 * Example: mongodb+srv://user:pass@cluster0.xyz... -> mongodb+srv://user:***@cluster0.xyz...
 */
export function sanitizeMongoUri(rawUri?: string): string {
  if (!rawUri) return '[empty URI]';
  return rawUri.replace(/\/\/(.*?):(.*?)@/, '//$1:***@');
}

/**
 * Returns the configured MongoDB URI.
 * Throws a clean, descriptive error if MONGODB_URI is not set.
 * Does NOT fallback to an unintended local database (e.g., localhost:27017).
 */
export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      'Database configuration missing. MONGODB_URI environment variable is not defined.'
    );
  }
  return uri;
}

/**
 * Maps raw database connection errors into clean, secure, user-facing error messages.
 * Prevents internal connection strings, IP addresses, or driver stack traces from leaking.
 */
export function getDatabaseErrorMessage(error: any): string {
  if (!error) {
    return "We couldn't connect to the service. Please try again shortly.";
  }

  const msg = String(error?.message || error || '').toLowerCase();
  
  // IP whitelist or network access failure on MongoDB Atlas
  if (
    msg.includes("ip that isn't whitelisted") ||
    msg.includes('tlsv1 alert internal error') ||
    msg.includes('ssl alert number 80') ||
    msg.includes('serverselectionerror') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('enotfound')
  ) {
    return "We couldn't connect to the service. Please try again shortly.";
  }

  // Database configuration missing
  if (msg.includes('database configuration missing')) {
    return "We couldn't connect to the service. Please try again shortly.";
  }

  return "We couldn't connect to the service. Please try again shortly.";
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  // 1. If connection is already open and active, reuse it immediately (serverless warm start)
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // 2. If connection is in process of connecting, wait for the existing promise
  if (mongoose.connection.readyState === 2 && cached!.promise) {
    await cached!.promise;
    return mongoose;
  }

  // 3. If disconnected (0) or disconnecting (3), clear stale cached promise
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached!.promise = null;
    cached!.conn = null;
  }

  if (!cached!.promise) {
    const uri = getMongoUri();
    const sanitized = sanitizeMongoUri(uri);

    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 30000,
      tls: true,
      ssl: true,
    };

    cached!.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        console.log(`[MongoDB] Connected successfully to ${sanitized}`);
        return mongooseInstance;
      })
      .catch((err) => {
        cached!.promise = null;
        cached!.conn = null;
        const errorMsg = String(err?.message || '');
        if (
          errorMsg.includes('SSL alert number 80') ||
          errorMsg.includes('tlsv1 alert internal error') ||
          errorMsg.includes('whitelist')
        ) {
          console.error(
            `[MongoDB Error] Atlas TLS/Firewall connection rejected for ${sanitized}. ` +
            `Ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access (required for Vercel): ` +
            `https://cloud.mongodb.com/`
          );
        } else {
          console.error(`[MongoDB Error] Connection failed to ${sanitized}: ${errorMsg}`);
        }
        throw err;
      });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    cached!.conn = null;
    throw e;
  }

  return cached!.conn;
}

export function isMongoConfigured(): boolean {
  const uri = process.env.MONGODB_URI?.trim();
  return Boolean(uri && uri.length > 5);
}
