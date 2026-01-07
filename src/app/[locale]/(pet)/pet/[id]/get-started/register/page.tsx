import ClientRegisterPetPage from '@/components/get-started/ClientRegisterPetPage';
import { GENDERS, GENDERS_HEBREW } from '@/src/lib/hardcoded-data';
import { getBreedsForType } from '@/src/lib/data/comprehensive-breeds';

const page = async ({ params }: { params: { id: string } }) => {
  const petId = params.id;

  // Get data from local comprehensive breeds data (not Firebase)
  const allDogBreeds = getBreedsForType('dog');
  const allCatBreeds = getBreedsForType('cat');
  const allOtherBreeds = getBreedsForType('other');
  const allBreeds = [...allDogBreeds, ...allCatBreeds, ...allOtherBreeds];

  // Transform genders to match expected format with both English and Hebrew labels
  const genders = GENDERS.map((gender, index) => {
    const hebrewGender = GENDERS_HEBREW.find(g => g.value === gender.value);
    return {
      id: index + 1,
      labels: { en: gender.label, he: hebrewGender?.label || gender.label }
    };
  });

  // Transform breeds to match expected format with both English and Hebrew labels
  const breeds = allBreeds.map((breed, index) => ({
    id: index + 1,
    labels: { en: breed.en, he: breed.he }
  }));

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