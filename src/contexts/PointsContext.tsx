'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';

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

  // Calculate total points from breakdown
  const userPoints = pointsBreakdown.registration + pointsBreakdown.phone + pointsBreakdown.pet + pointsBreakdown.share;

  // Reset points when user changes
  useEffect(() => {
    if (user) {
      setPointsBreakdown({
        registration: 30,
        phone: 0,
        pet: 0,
        share: 0
      });
      setShowPointsBreakdown(false);
    }
  }, [user]);

  // Function to add points to a specific category
  const addPoints = (category: 'registration' | 'phone' | 'pet' | 'share', points: number) => {
    setPointsBreakdown(prev => ({
      ...prev,
      [category]: prev[category] + points
    }));
  };

  // Keep setUserPoints for backward compatibility, but it now updates the breakdown
  const setUserPoints = (points: number | ((prev: number) => number)) => {
    if (typeof points === 'function') {
      const newTotal = points(userPoints);
      const difference = newTotal - userPoints;
      // Add the difference to the share category (most common use case)
      if (difference > 0) {
        addPoints('share', difference);
      }
    } else {
      const difference = points - userPoints;
      if (difference > 0) {
        addPoints('share', difference);
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
    addPoints
  };

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
};
