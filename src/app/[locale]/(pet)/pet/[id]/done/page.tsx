import DonePage from '@/src/components/DonePage';
import { redirect } from '@/src/i18n/routing';
import { getPetByIdFromFirestore } from '@/src/lib/supabase/database/pets';
import { getLocale } from 'next-intl/server';

const page = async ({ params }: { params: { id: string } }) => {
  const id = params.id;
  const locale = await getLocale();

  const petResult = await getPetByIdFromFirestore(id);

  if (!petResult.success || !petResult.pet) {
    redirect({ href: '/', locale });
    return;
  }

  return <DonePage name={petResult.pet.name} imageUrl={petResult.pet.imageUrl} />;
};

export default page;
