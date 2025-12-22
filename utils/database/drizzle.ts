import { drizzle } from 'drizzle-orm/neon-http';

// Validate DATABASE_URL before initialization
function isValidDatabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  if (url === 'your_database_connection_string') return false;
  if (url.includes('your_database')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
  } catch {
    return false;
  }
}

// Lazy initialization to avoid build-time errors
let _db: ReturnType<typeof drizzle> | null = null;
let _initializationError: Error | null = null;

function getDb() {
  // If we already tried and failed, return the mock
  if (_initializationError && _db) {
    return _db;
  }

  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL;
    
    // Double-check validation - be very strict
    const isValid = isValidDatabaseUrl(databaseUrl);
    
    // Skip initialization if DATABASE_URL is not valid
    if (!isValid || !databaseUrl) {
      // During build time, we need to provide a mock that won't crash
      // but will throw a helpful error when actually used
      const mockSql = {
        execute: async () => {
          throw new Error(
            'Database connection string is not configured. Please set DATABASE_URL environment variable.'
          );
        },
        transaction: async () => {
          throw new Error(
            'Database connection string is not configured. Please set DATABASE_URL environment variable.'
          );
        }
      } as any;
      
      _db = drizzle({ client: mockSql });
      _initializationError = new Error('DATABASE_URL not configured');
      return _db;
    }
    
    // At this point, we know databaseUrl is valid and not a placeholder
    try {
      // Use require with try-catch to handle build-time errors gracefully
      let neon: any;
      try {
        const neonModule = require('@neondatabase/serverless');
        neon = neonModule.neon || neonModule.default?.neon;
        if (!neon) {
          throw new Error('neon function not found in @neondatabase/serverless');
        }
      } catch (importError) {
        // If import fails during build, create a mock
        throw new Error('Failed to import @neondatabase/serverless');
      }
      
      // Double-check URL is still valid before calling neon
      if (!isValidDatabaseUrl(databaseUrl)) {
        throw new Error('DATABASE_URL validation failed');
      }
      
      // Only call neon if we have a valid URL - wrap in try-catch
      let sql: any;
      try {
        sql = neon(databaseUrl);
      } catch (neonError) {
        // If neon() throws (e.g., invalid URL format), catch it here
        throw new Error(`Failed to initialize neon client: ${neonError instanceof Error ? neonError.message : 'Unknown error'}`);
      }
      
      _db = drizzle({ client: sql });
    } catch (error) {
      // If initialization fails (including during build), create a mock
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const mockSql = {
        execute: async () => {
          throw new Error(
            `Database not available: ${errorMessage}. This is expected during build if DATABASE_URL is not configured.`
          );
        },
        transaction: async () => {
          throw new Error(
            `Database not available: ${errorMessage}. This is expected during build if DATABASE_URL is not configured.`
          );
        }
      } as any;
      
      _db = drizzle({ client: mockSql });
      _initializationError = error instanceof Error ? error : new Error('Unknown database error');
    }
  }
  
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>];
  }
});
