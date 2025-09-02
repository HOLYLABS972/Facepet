import ClientRegisterPetPage from '@/components/get-started/ClientRegisterPetPage';
import { getPetBreeds, getPetGenders } from '@/utils/database/queries/pets';

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const petId = (await params).id;

  const genders = await getPetGenders();
  const breeds = await getPetBreeds();

  return (
    <ClientRegisterPetPage
      genders={genders}
      breeds={breeds}
      userDetails={{
        fullName: '',
        phone: '',
        email: ''
      }}
    />
  );
};
export default page;
