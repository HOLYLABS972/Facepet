import EditPetPage from '@/components/EditPetPage';
import { getPetById } from '@/src/lib/supabase/database/pets';
import { notFound } from 'next/navigation';
import AuthGuard from '@/src/components/auth/AuthGuard';

interface EditPetPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function EditPet({ params }: EditPetPageProps) {
  const { id } = params;

  const result = await getPetById(id, true);

  if (!result.success || !result.pet) {
    notFound();
  }

  return (
    <AuthGuard>
      <EditPetPage pet={result.pet} />
    </AuthGuard>
  );
}
