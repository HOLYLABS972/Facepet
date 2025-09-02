import EditPetPage from '@/components/EditPetPage';
import { getPetById } from '@/src/lib/firebase/simple-pets';
import { notFound } from 'next/navigation';

interface EditPetPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function EditPet({ params }: EditPetPageProps) {
  const { id } = params;
  
  const result = await getPetById(id);
  
  if (!result.success || !result.pet) {
    notFound();
  }

  return <EditPetPage pet={result.pet} />;
}
