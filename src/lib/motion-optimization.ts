/**
 * Motion optimization utilities for better performance
 * Reduces animation complexity on low-power devices and iOS
 */

import { useReducedMotion } from 'framer-motion';

/**
 * Get optimized animation variants based on device capabilities
 */
export const getOptimizedVariants = () => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return {
      // Instant animations for reduced motion preference
      fadeIn: { opacity: 1 },
      fadeOut: { opacity: 0 },
      scaleIn: { scale: 1, opacity: 1 },
      scaleOut: { scale: 0.9, opacity: 0 },
      slideInLeft: { x: 0, opacity: 1 },
      slideOutRight: { x: 100, opacity: 0 },
    };
  }

  return {
    // Standard animations
    fadeIn: { opacity: 1, transition: { duration: 0.2 } },
    fadeOut: { opacity: 0, transition: { duration: 0.2 } },
    scaleIn: { scale: 1, opacity: 1, transition: { duration: 0.2 } },
    scaleOut: { scale: 0.9, opacity: 0, transition: { duration: 0.2 } },
    slideInLeft: { x: 0, opacity: 1, transition: { duration: 0.3 } },
    slideOutRight: { x: 100, opacity: 0, transition: { duration: 0.3 } },
  };
};

/**
 * Check if device can handle complex animations
 */
export const canUseComplexAnimations = (): boolean => {
  if (typeof window === 'undefined') return false;

  // Disable complex animations on iOS Safari
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) return false;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return false;

  // Check for low-power mode indicators
  const connection = (navigator as any).connection;
  if (connection?.saveData || connection?.effectiveType === '2g') return false;

  return true;
};

/**
 * Get safe transition duration based on device
 */
export const getSafeTransitionDuration = (defaultMs: number = 300): number => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isIOS || prefersReducedMotion) return 100; // Faster, less processing
  return defaultMs;
};
