import PetProfilePage from '@/components/PetProfilePage';
import { getPetById } from '@/src/lib/firebase/simple-pets';
import { notFound } from 'next/navigation';

interface PetPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function Pet({ params }: PetPageProps) {
  const { id } = params;
  
  const result = await getPetById(id);
  
  if (!result.success || !result.pet) {
    notFound();
  }

  return <PetProfilePage pet={result.pet} />;
}
