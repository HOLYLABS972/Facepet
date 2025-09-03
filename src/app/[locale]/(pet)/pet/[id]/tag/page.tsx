import { getPetById } from '@/src/lib/firebase/simple-pets';
import { notFound } from 'next/navigation';
import NFCScanPage from '@/components/NFCScanPage';
import AuthGuard from '@/src/components/auth/AuthGuard';

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

  return (
    <AuthGuard>
      <NFCScanPage pet={result.pet} />
    </AuthGuard>
  );
}
