import PetProfilePage from '@/components/PetProfilePage';
import { getPetWithConsolidatedOwner } from '@/src/lib/firebase/consolidated-pet-creation';
import { notFound } from 'next/navigation';

interface PetPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function PublicPetPage({ params }: PetPageProps) {
  const { id } = await params;
  
  const result = await getPetWithConsolidatedOwner(id);
  
  if (!result.success || !result.pet) {
    notFound();
  }

  return <PetProfilePage pet={result.pet} owner={result.owner} vet={result.vet} />;
}
