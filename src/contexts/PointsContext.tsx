'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserPoints, updateUserPoints, addPointsToCategory, recalculateUserPoints, getUserTransactions } from '../lib/firebase/points';

interface PointsContextType {
  userPoints: number;
  setUserPoints: (points: number | ((prev: number) => number)) => void;
  pointsBreakdown: {
    registration: number;
    phone: number;
    pet: number;
    share: number;
  };
  setPointsBreakdown: (breakdown: any) => void;
  showPointsBreakdown: boolean;
  setShowPointsBreakdown: (show: boolean) => void;
  addPoints: (category: 'registration' | 'phone' | 'pet' | 'share', points: number, description?: string) => void;
  recalculatePoints: () => Promise<void>;
  isLoading: boolean;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};

interface PointsProviderProps {
  children: ReactNode;
}

export const PointsProvider = ({ children }: PointsProviderProps) => {
  const { user } = useAuth();
  const [pointsBreakdown, setPointsBreakdown] = useState({
    registration: 30,
    phone: 0,
    pet: 0,
    share: 0
  });
  const [showPointsBreakdown, setShowPointsBreakdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate total points from breakdown
  const userPoints = pointsBreakdown.registration + pointsBreakdown.phone + pointsBreakdown.pet + pointsBreakdown.share;

  // Load user points from Firestore when user changes
  useEffect(() => {
    const loadUserPoints = async () => {
      if (user) {
        setIsLoading(true);
        try {
          // Force fresh data by adding timestamp to prevent caching issues
          const result = await getUserPoints(user);
          if (result.success && result.points) {
            console.log('Loaded points for user:', user.uid, result.points);
            setPointsBreakdown(result.points.pointsBreakdown);
          } else {
            console.log('No points found, setting defaults for user:', user.uid);
            // Set default points if loading fails
            setPointsBreakdown({
              registration: 30,
              phone: 0,
              pet: 0,
              share: 0
            });
          }
        } catch (error) {
          console.error('Error loading user points:', error);
          // Set default points on error
          setPointsBreakdown({
            registration: 30,
            phone: 0,
            pet: 0,
            share: 0
          });
        } finally {
          setIsLoading(false);
        }
        setShowPointsBreakdown(false);
      } else {
        // Reset points when user logs out
        setPointsBreakdown({
          registration: 30,
          phone: 0,
          pet: 0,
          share: 0
        });
      }
    };

    loadUserPoints();
  }, [user]);

  // Function to add points to a specific category with transaction logging
  const addPoints = async (category: 'registration' | 'phone' | 'pet' | 'share', points: number, description?: string) => {
    if (!user) {
      console.error('No user found when trying to add points');
      return;
    }

    console.log(`Adding ${points} points to ${category} category for user ${user.uid}`);
    console.log('Current breakdown:', pointsBreakdown);

    try {
      // Use the new transaction-based system
      const result = await addPointsToCategory(user, category, points, description);
      
      if (result.success) {
        // Reload points from Firestore to ensure consistency
        const freshPointsResult = await getUserPoints(user);
        if (freshPointsResult.success && freshPointsResult.points) {
          setPointsBreakdown(freshPointsResult.points.pointsBreakdown);
          console.log('Points updated successfully:', freshPointsResult.points);
        }
      } else {
        console.error('Failed to add points:', result.error);
      }
    } catch (error) {
      console.error('Error adding points:', error);
    }
  };

  // Function to recalculate points from transaction history
  const recalculatePoints = async () => {
    if (!user) {
      console.error('No user found when trying to recalculate points');
      return;
    }

    try {
      console.log('Recalculating points for user:', user.uid);
      const result = await recalculateUserPoints(user);
      
      if (result.success && result.points) {
        setPointsBreakdown(result.points.pointsBreakdown);
        console.log('Points recalculated successfully:', result.points);
      } else {
        console.error('Failed to recalculate points:', result.error);
      }
    } catch (error) {
      console.error('Error recalculating points:', error);
    }
  };

  // Keep setUserPoints for backward compatibility, but it now updates the breakdown
  const setUserPoints = async (points: number | ((prev: number) => number)) => {
    if (!user) return;

    if (typeof points === 'function') {
      const newTotal = points(userPoints);
      const difference = newTotal - userPoints;
      // Add the difference to the share category (most common use case)
      if (difference > 0) {
        await addPoints('share', difference);
      }
    } else {
      const difference = points - userPoints;
      if (difference > 0) {
        await addPoints('share', difference);
      }
    }
  };

  const value = {
    userPoints,
    setUserPoints,
    pointsBreakdown,
    setPointsBreakdown,
    showPointsBreakdown,
    setShowPointsBreakdown,
    addPoints,
    recalculatePoints,
    isLoading
  };

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
};
