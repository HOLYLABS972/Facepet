import { auth } from '@/auth';
import ClientRegisterPetPage from '@/components/get-started/ClientRegisterPetPage';
import { redirect } from '@/src/i18n/routing';
import { checkPetIdAvailability } from '@/src/lib/actions/pets';
import { getPetBreeds, getPetGenders } from '@/utils/database/queries/pets';
import { getUserDetails } from '@/utils/database/queries/users';
import { getLocale } from 'next-intl/server';

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const petId = (await params).id;
  const locale = await getLocale();
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect({ href: '/', locale });
    return;
  }

  const petIdCheckResult = await checkPetIdAvailability(petId);
  if (!petIdCheckResult.success) {
    redirect({ href: '/pet-not-found', locale });
    return;
  }

  const genders = await getPetGenders();
  const breeds = await getPetBreeds();
  const userDetails = await getUserDetails(session?.user?.id);

  return (
    <ClientRegisterPetPage
      genders={genders}
      breeds={breeds}
      userDetails={userDetails}
    />
  );
};
export default page;
