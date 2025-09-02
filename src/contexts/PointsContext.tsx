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
  const [userPoints, setUserPoints] = useState(30); // Start with 30 points (registration)
  const [pointsBreakdown, setPointsBreakdown] = useState({
    registration: 30,
    phone: 0,
    pet: 0,
    share: 0
  });
  const [showPointsBreakdown, setShowPointsBreakdown] = useState(false);

  // Reset points when user changes
  useEffect(() => {
    if (user) {
      setUserPoints(30);
      setPointsBreakdown({
        registration: 30,
        phone: 0,
        pet: 0,
        share: 0
      });
      setShowPointsBreakdown(false);
    }
  }, [user]);

  const value = {
    userPoints,
    setUserPoints,
    pointsBreakdown,
    setPointsBreakdown,
    showPointsBreakdown,
    setShowPointsBreakdown
  };

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
};
