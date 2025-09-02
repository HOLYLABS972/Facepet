'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getUserPoints, updateUserPoints, addPointsToCategory } from '../lib/firebase/points';

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
  addPoints: (category: 'registration' | 'phone' | 'pet' | 'share', points: number) => void;
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
          const result = await getUserPoints(user);
          if (result.success && result.points) {
            setPointsBreakdown(result.points.pointsBreakdown);
          } else {
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
      }
    };

    loadUserPoints();
  }, [user]);

  // Function to add points to a specific category
  const addPoints = async (category: 'registration' | 'phone' | 'pet' | 'share', points: number) => {
    if (!user) return;

    const newBreakdown = {
      ...pointsBreakdown,
      [category]: pointsBreakdown[category] + points
    };

    // Update local state immediately for UI responsiveness
    setPointsBreakdown(newBreakdown);

    // Persist to Firestore
    try {
      await updateUserPoints(user, newBreakdown);
    } catch (error) {
      console.error('Error updating points in Firestore:', error);
      // Revert local state if Firestore update fails
      setPointsBreakdown(pointsBreakdown);
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
    isLoading
  };

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
};
