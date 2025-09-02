// import { auth } from '@/auth'; // Removed - using Firebase Auth
import DonePage from '@/src/components/DonePage';
import { redirect } from '@/src/i18n/routing';
import { getPetDetailsById } from '@/utils/database/queries/pets';
import { UUID } from 'crypto';
import { getLocale } from 'next-intl/server';

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const id = (await params).id;
  const locale = await getLocale();
  const session = await auth();

  const pet = await getPetDetailsById(id as UUID);

  if (!pet || !session || !session.user || session.user.id !== pet.userId) {
    redirect({ href: '/', locale });
    return;
  }

  return <DonePage name={pet.name} imageUrl={pet.imageUrl} />;
};

export default page;
