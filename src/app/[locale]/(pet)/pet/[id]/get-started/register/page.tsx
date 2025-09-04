import ClientRegisterPetPage from '@/components/get-started/ClientRegisterPetPage';
import { getBreedsFromFirestore, getGendersFromFirestore, initializeBreedsCollection, initializeGendersCollection } from '@/src/lib/firebase/collections/breeds';

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const petId = (await params).id;

  // Initialize collections if they don't exist
  await initializeBreedsCollection();
  await initializeGendersCollection();

  // Get data from Firebase
  const gendersData = await getGendersFromFirestore();
  const breedsData = await getBreedsFromFirestore();

  // Transform data to match expected format (convert string IDs to numbers)
  const genders = gendersData.map((gender, index) => ({
    id: index + 1, // Convert to sequential number
    labels: gender.labels
  }));

  const breeds = breedsData.map((breed, index) => ({
    id: index + 1, // Convert to sequential number
    labels: breed.labels
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