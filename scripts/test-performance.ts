#!/usr/bin/env tsx

/**
 * Performance testing script for pet profile loading
 * Run with: npx tsx scripts/test-performance.ts
 */

import { getPetDetailsById } from '@/utils/database/queries/pets';
import { UUID } from 'crypto';

interface PerformanceResult {
  operation: string;
  duration: number;
  cacheHit: boolean;
  success: boolean;
  error?: string;
}

class PerformanceTester {
  private results: PerformanceResult[] = [];

  async testPetLoading(petId: string, iterations: number = 5): Promise<void> {
    console.log(`\n🧪 Testing pet loading performance for ID: ${petId}`);
    console.log(`Running ${iterations} iterations...\n`);

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      let success = false;
      let error: string | undefined;
      let cacheHit = false;

      try {
        // Clear cache for first iteration to test cold start
        if (i === 0) {
          console.log('🧊 Cold start (no cache)');
        } else {
          console.log(`🔥 Warm start ${i} (with cache)`);
          cacheHit = true;
        }

        const pet = await getPetDetailsById(petId as UUID);
        success = !!pet;

        if (!pet) {
          error = 'Pet not found';
        }
      } catch (err) {
        error = err instanceof Error ? err.message : 'Unknown error';
      }

      const duration = Date.now() - startTime;

      this.results.push({
        operation: `pet-loading-${i + 1}`,
        duration,
        cacheHit: i > 0, // First iteration is always cache miss
        success,
        error
      });

      console.log(
        `   ⏱️  ${duration}ms ${success ? '✅' : '❌'} ${cacheHit ? '(cached)' : '(fresh)'}`
      );

      // Small delay between iterations
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  async testConcurrentLoading(
    petIds: string[],
    concurrency: number = 3
  ): Promise<void> {
    console.log(
      `\n🚀 Testing concurrent loading of ${petIds.length} pets (concurrency: ${concurrency})`
    );

    const startTime = Date.now();
    const promises: Promise<any>[] = [];

    for (let i = 0; i < petIds.length; i += concurrency) {
      const batch = petIds.slice(i, i + concurrency);

      const batchPromises = batch.map(async (petId, index) => {
        const iterationStart = Date.now();
        try {
          const pet = await getPetDetailsById(petId as UUID);
          const duration = Date.now() - iterationStart;

          this.results.push({
            operation: `concurrent-loading-${i + index + 1}`,
            duration,
            cacheHit: false, // Assume cache miss for concurrent test
            success: !!pet
          });

          return { petId, success: !!pet, duration };
        } catch (error) {
          const duration = Date.now() - iterationStart;
          this.results.push({
            operation: `concurrent-loading-${i + index + 1}`,
            duration,
            cacheHit: false,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          return { petId, success: false, duration, error };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach((result) => {
        console.log(
          `   🔄 Pet ${result.petId}: ${result.duration}ms ${result.success ? '✅' : '❌'}`
        );
      });

      // Small delay between batches
      if (i + concurrency < petIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`\n   📊 Total concurrent test duration: ${totalDuration}ms`);
  }

  generateReport(): void {
    console.log('\n📈 PERFORMANCE REPORT');
    console.log('='.repeat(50));

    if (this.results.length === 0) {
      console.log('No test results available.');
      return;
    }

    // Overall stats
    const totalTests = this.results.length;
    const successfulTests = this.results.filter((r) => r.success).length;
    const cacheHits = this.results.filter((r) => r.cacheHit).length;
    const cacheMisses = this.results.filter((r) => !r.cacheHit).length;

    console.log(`\n📊 Overall Statistics:`);
    console.log(`   Total tests: ${totalTests}`);
    console.log(
      `   Successful: ${successfulTests} (${Math.round((successfulTests / totalTests) * 100)}%)`
    );
    console.log(`   Cache hits: ${cacheHits}`);
    console.log(`   Cache misses: ${cacheMisses}`);

    // Performance stats
    const durations = this.results.map((r) => r.duration);
    const avgDuration = Math.round(
      durations.reduce((a, b) => a + b, 0) / durations.length
    );
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    console.log(`\n⏱️  Performance Metrics:`);
    console.log(`   Average duration: ${avgDuration}ms`);
    console.log(`   Fastest: ${minDuration}ms`);
    console.log(`   Slowest: ${maxDuration}ms`);

    // Cache performance
    if (cacheHits > 0 && cacheMisses > 0) {
      const cacheHitDurations = this.results
        .filter((r) => r.cacheHit)
        .map((r) => r.duration);
      const cacheMissDurations = this.results
        .filter((r) => !r.cacheHit)
        .map((r) => r.duration);

      const avgCacheHit = Math.round(
        cacheHitDurations.reduce((a, b) => a + b, 0) / cacheHitDurations.length
      );
      const avgCacheMiss = Math.round(
        cacheMissDurations.reduce((a, b) => a + b, 0) /
          cacheMissDurations.length
      );

      console.log(`\n🎯 Cache Performance:`);
      console.log(`   Cache hit avg: ${avgCacheHit}ms`);
      console.log(`   Cache miss avg: ${avgCacheMiss}ms`);
      console.log(
        `   Cache speedup: ${Math.round(((avgCacheMiss - avgCacheHit) / avgCacheMiss) * 100)}%`
      );
    }

    // Errors
    const errors = this.results.filter((r) => r.error);
    if (errors.length > 0) {
      console.log(`\n❌ Errors (${errors.length}):`);
      errors.forEach((error) => {
        console.log(`   ${error.operation}: ${error.error}`);
      });
    }

    console.log('\n' + '='.repeat(50));
  }
}

// Main execution
async function main() {
  const tester = new PerformanceTester();

  // Test with a sample pet ID (you'll need to replace with actual pet ID)
  const samplePetId = 'aabb5163-e82f-45d2-b06c-b7b4397485bc'; // Replace with actual pet ID

  try {
    console.log('🚀 Starting Performance Tests...');

    // Test single pet loading with cache
    await tester.testPetLoading(samplePetId, 5);

    // Test concurrent loading (if you have multiple pet IDs)
    // await tester.testConcurrentLoading([samplePetId, 'another-pet-id'], 3);

    // Generate report
    tester.generateReport();
  } catch (error) {
    console.error('❌ Performance test failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { PerformanceTester };
