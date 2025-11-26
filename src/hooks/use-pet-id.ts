import { useEffect, useState } from 'react';

export const usePetId = () => {
  const [petId, setPetId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Retrieve petId from localStorage on initial load (client-side only)
  useEffect(() => {
    setIsMounted(true);
    try {
      const storedPetId = localStorage.getItem('petId');
      if (storedPetId) {
        setPetId(storedPetId);
        console.log('[usePetId] Loaded petId from localStorage:', storedPetId);
      } else {
        console.log('[usePetId] No petId found in localStorage');
      }
    } catch (error) {
      console.error('[usePetId] Error accessing localStorage:', error);
    }
  }, []);

  // Save petId to localStorage and state
  const savePetId = (id: string) => {
    localStorage.setItem('petId', id);
    setPetId(id);
  };

  // Clear petId from localStorage and state
  const clearPetId = () => {
    localStorage.removeItem('petId');
    setPetId(null);
  };

  return { petId, savePetId, clearPetId };
};
