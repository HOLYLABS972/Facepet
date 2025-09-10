import { auth } from '@/auth'; // Make sure this function returns the current session
import MyPetsClient from '@/src/components/MyPetClient';
import { getPets } from '@/src/lib/actions/pets';
import { getLocale } from 'next-intl/server';

export default async function MyPetsPage() {
  const locale = await getLocale();
  const session = await auth();

  if (!session?.user?.id) {
    // You might want to redirect to sign-in or return an error message
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;
  const petsData = await getPets(locale, userId);

  return <MyPetsClient pets={petsData} />;
}
