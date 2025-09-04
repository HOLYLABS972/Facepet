import redis from '@/utils/database/redis';
import { UUID } from 'crypto';

// Cache TTL configurations (in seconds)
const CACHE_TTL = {
  PET_DETAILS: 300, // 5 minutes
  FORMATTED_ADDRESS: 3600, // 1 hour
  BREEDS: 86400, // 24 hours
  GENDERS: 86400 // 24 hours
} as const;

// Cache key generators
const CACHE_KEYS = {
  petDetails: (id: string) => `pet:details:${id}`,
  formattedAddress: (placeId: string, locale: string) =>
    `address:${placeId}:${locale}`,
  breeds: () => 'breeds:all',
  genders: () => 'genders:all'
} as const;

/**
 * Generic cache utility functions
 */
export class CacheManager {
  /**
   * Get data from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      return cached as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache with TTL
   */
  static async set<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  /**
   * Delete data from cache
   */
  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error(
        `Cache delete pattern error for pattern ${pattern}:`,
        error
      );
    }
  }
}

/**
 * Pet-specific cache functions
 */
export class PetCache {
  /**
   * Get pet details from cache
   */
  static async getPetDetails(id: UUID): Promise<Pet | null> {
    const key = CACHE_KEYS.petDetails(id);
    return await CacheManager.get<Pet>(key);
  }

  /**
   * Set pet details in cache
   */
  static async setPetDetails(id: UUID, pet: Pet): Promise<void> {
    const key = CACHE_KEYS.petDetails(id);
    await CacheManager.set(key, pet, CACHE_TTL.PET_DETAILS);
  }

  /**
   * Invalidate pet details cache
   */
  static async invalidatePetDetails(id: UUID): Promise<void> {
    const key = CACHE_KEYS.petDetails(id);
    await CacheManager.del(key);
  }

  /**
   * Invalidate all pet caches for a user
   */
  static async invalidateUserPets(userId: string): Promise<void> {
    // This would require storing user->pet mappings, for now just log
    console.log(`Invalidating caches for user ${userId}`);
    // In a more sophisticated setup, we'd maintain a user->pets mapping
  }
}

/**
 * Address formatting cache functions
 */
export class AddressCache {
  /**
   * Get formatted address from cache
   */
  static async getFormattedAddress(
    placeId: string,
    locale: string
  ): Promise<string | null> {
    const key = CACHE_KEYS.formattedAddress(placeId, locale);
    return await CacheManager.get<string>(key);
  }

  /**
   * Set formatted address in cache
   */
  static async setFormattedAddress(
    placeId: string,
    locale: string,
    address: string
  ): Promise<void> {
    const key = CACHE_KEYS.formattedAddress(placeId, locale);
    await CacheManager.set(key, address, CACHE_TTL.FORMATTED_ADDRESS);
  }
}

/**
 * Static data cache functions (breeds, genders)
 */
export class StaticDataCache {
  /**
   * Get breeds from cache
   */
  static async getBreeds(): Promise<any[] | null> {
    const key = CACHE_KEYS.breeds();
    return await CacheManager.get<any[]>(key);
  }

  /**
   * Set breeds in cache
   */
  static async setBreeds(breeds: any[]): Promise<void> {
    const key = CACHE_KEYS.breeds();
    await CacheManager.set(key, breeds, CACHE_TTL.BREEDS);
  }

  /**
   * Get genders from cache
   */
  static async getGenders(): Promise<any[] | null> {
    const key = CACHE_KEYS.genders();
    return await CacheManager.get<any[]>(key);
  }

  /**
   * Set genders in cache
   */
  static async setGenders(genders: any[]): Promise<void> {
    const key = CACHE_KEYS.genders();
    await CacheManager.set(key, genders, CACHE_TTL.GENDERS);
  }

  /**
   * Invalidate static data caches
   */
  static async invalidateStaticData(): Promise<void> {
    await Promise.all([
      CacheManager.del(CACHE_KEYS.breeds()),
      CacheManager.del(CACHE_KEYS.genders())
    ]);
  }
}

/**
 * Cache invalidation utilities
 */
export class CacheInvalidator {
  /**
   * Invalidate all caches related to a pet update
   */
  static async invalidatePetUpdate(
    petId: string,
    userId: string
  ): Promise<void> {
    await Promise.all([
      PetCache.invalidatePetDetails(petId as UUID)
      // Could also invalidate user's pet list cache here
    ]);
  }

  /**
   * Invalidate caches when static data is updated
   */
  static async invalidateStaticDataUpdate(): Promise<void> {
    await StaticDataCache.invalidateStaticData();
  }
}

/**
 * Cache warming functions
 */
export class CacheWarmer {
  /**
   * Warm up static data caches
   */
  static async warmStaticData(): Promise<void> {
    // This would be called during app startup or via a cron job
    console.log('Warming up static data caches...');
    // Implementation would fetch and cache breeds/genders
  }

  /**
   * Warm up popular pet caches
   */
  static async warmPopularPets(petIds: string[]): Promise<void> {
    console.log(`Warming up caches for ${petIds.length} popular pets...`);
    // Implementation would pre-fetch and cache popular pet data
  }

  /**
   * Warm up address caches for popular locations
   */
  static async warmPopularAddresses(
    addresses: { placeId: string; locale: string }[]
  ): Promise<void> {
    console.log(`Warming up ${addresses.length} popular addresses...`);
    // Implementation would pre-fetch and cache popular addresses
  }
}
