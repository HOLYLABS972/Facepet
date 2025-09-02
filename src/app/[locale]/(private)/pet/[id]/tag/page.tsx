import { getPetById } from '@/src/lib/firebase/simple-pets';
import { notFound } from 'next/navigation';
import NFCScanPage from '@/components/NFCScanPage';

interface TagPetPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function TagPet({ params }: TagPetPageProps) {
  const { id } = params;
  
  const result = await getPetById(id);
  
  if (!result.success || !result.pet) {
    notFound();
  }

  return <NFCScanPage pet={result.pet} />;
}
