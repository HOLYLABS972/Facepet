import MyPetsClient from '@/src/components/MyPetClient';
import { getPets } from '@/src/lib/actions/pets';
import { getLocale } from 'next-intl/server';

export default async function MyPetsPage() {
  const locale = await getLocale();
  
  // For now, we'll pass empty pets array since we need to get the user ID from Firebase Auth
  // This will be handled by the MyPetsClient component using Firebase Auth
  const petsData = await getPets(locale, '');

  return <MyPetsClient pets={petsData} />;
}
