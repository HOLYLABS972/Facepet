import EditPetPage from '@/components/EditPetPage';
import { getPetById } from '@/src/lib/firebase/simple-pets';
import { notFound } from 'next/navigation';
import AuthGuard from '@/src/components/auth/AuthGuard';

interface EditPetPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function EditPet({ params }: EditPetPageProps) {
  const { id } = await params;
  
  const result = await getPetById(id);
  
  if (!result.success || !result.pet) {
    notFound();
  }

  return (
    <AuthGuard>
      <EditPetPage pet={result.pet} />
    </AuthGuard>
  );
}
