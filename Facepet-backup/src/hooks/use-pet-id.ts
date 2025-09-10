import { useEffect, useState } from 'react';

export const usePetId = () => {
  const [petId, setPetId] = useState<string | null>(null);

  // Retrieve petId from localStorage on initial load
  useEffect(() => {
    const storedPetId = localStorage.getItem('petId');
    if (storedPetId) {
      setPetId(storedPetId);
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
