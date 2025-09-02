import EditPetForm from './EditPetForm';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  imageUrl?: string;
  description?: string;
  age?: string;
  gender?: string;
  notes?: string;
}

interface EditPetPageProps {
  pet: Pet;
}

export default function EditPetPage({ pet }: EditPetPageProps) {
  return <EditPetForm pet={pet} />;
}