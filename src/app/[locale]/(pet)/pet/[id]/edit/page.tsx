import EditPetPage from '@/src/components/EditPetPage';
import {
  getPetBreeds,
  getPetDetailsForEditById,
  getPetGenders
} from '@/utils/database/queries/pets';

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const petId = (await params).id;

  const genders = await getPetGenders();
  const breeds = await getPetBreeds();
  const petDetails = await getPetDetailsForEditById(petId);

  if (!petDetails) {
    return <div>Pet not found</div>;
  }

  return (
    <EditPetPage
      petId={petId}
      petDetails={petDetails}
      genders={genders}
      breeds={breeds}
    />
  );
};
export default page;
