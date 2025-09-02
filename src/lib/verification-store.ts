// Shared verification store for OTP codes
// In production, this should be replaced with Redis or a database

interface VerificationData {
  code: string;
  expires: number;
}

class VerificationStore {
  private store = new Map<string, VerificationData>();

  constructor() {
    // Clean up expired entries every hour
    setInterval(() => {
      this.cleanup();
    }, 60 * 60 * 1000); // 1 hour
  }

  set(email: string, code: string, expiresInMinutes: number = 10): void {
    const expires = Date.now() + (expiresInMinutes * 60 * 1000);
    this.store.set(email, { code, expires });
  }

  get(email: string): VerificationData | undefined {
    const data = this.store.get(email);
    
    // Check if expired
    if (data && data.expires < Date.now()) {
      this.store.delete(email);
      return undefined;
    }
    
    return data;
  }

  delete(email: string): boolean {
    return this.store.delete(email);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.expires < now) {
        this.store.delete(key);
      }
    }
  }
}

// Export a singleton instance
export const verificationStore = new VerificationStore();
