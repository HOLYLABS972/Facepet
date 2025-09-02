import { getPetById } from '@/src/lib/firebase/simple-pets';
import { notFound } from 'next/navigation';
import EditPetPage from '@/components/EditPetPage';

interface EditPetProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function EditPet({ params }: EditPetProps) {
  const { id } = params;
  
  const result = await getPetById(id);
  
  if (!result.success || !result.pet) {
    notFound();
  }

  return <EditPetPage pet={result.pet} />;
}
