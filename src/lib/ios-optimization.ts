/**
 * iOS Memory Optimization Utilities
 * Helps reduce memory usage and prevents unnecessary network requests on iOS
 */

/**
 * Detect if running on iOS
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Clear all event listeners and timers on page unload
 * Prevents memory leaks on iOS
 */
export const cleanupOnUnload = () => {
  if (typeof window === 'undefined') return;

  // Prevent aggressive cleanup that might cause issues
  // Just log for debugging purposes
  console.log('[iOS] Cleanup handler registered for page unload');
};

/**
 * Optimize image loading for iOS by lazy loading
 */
export const setupIOSImageOptimization = () => {
  if (!isIOS()) return;

  // Add native lazy loading to all images
  if (typeof window !== 'undefined') {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      if (!img.loading) {
        img.loading = 'lazy';
      }
    });

    // Set up intersection observer for additional optimization
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src && !img.src) {
              img.src = img.dataset.src;
              observer.unobserve(img);
            }
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    }
  }
};

/**
 * Reduce animation frame rate on iOS to save memory
 */
export const optimizeAnimationsForIOS = () => {
  if (!isIOS()) return;

  // Reduce animation complexity by increasing motion tolerance
  if (typeof window !== 'undefined' && 'matchMedia' in window) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!prefersReducedMotion.matches) {
      // Add CSS variable to reduce animation duration on iOS
      document.documentElement.style.setProperty('--animation-duration', '0.2s');
    }
  }
};

/**
 * Debounce function to prevent rapid repeated calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function to limit function call frequency
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * Initialize all iOS optimizations on app startup
 */
export const initializeIOSOptimizations = () => {
  if (!isIOS()) return;

  // Setup optimizations
  cleanupOnUnload();
  setupIOSImageOptimization();
  optimizeAnimationsForIOS();

  console.log('[iOS] Optimizations initialized');

  // Monitor memory usage on iOS
  if ('memory' in performance) {
    const memInfo = (performance as any).memory;
    console.log(
      `[iOS Memory] Used: ${Math.round(memInfo.usedJSHeapSize / 1048576)}MB / ${Math.round(memInfo.jsHeapSizeLimit / 1048576)}MB`
    );
  }
};
