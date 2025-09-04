import { auth } from '@/auth';
import EditPetPage from '@/src/components/EditPetPage';
import { redirect } from '@/src/i18n/routing';
import { isPetLinkedToUser } from '@/src/lib/actions/pets';
import {
  getPetBreeds,
  getPetDetailsForEditById,
  getPetGenders
} from '@/utils/database/queries/pets';
import { getLocale } from 'next-intl/server';

const page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const petId = (await params).id;
  const locale = await getLocale();
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect({ href: '/', locale });
    return;
  }

  const isPetLinkedToUserResult = await isPetLinkedToUser(
    petId,
    session.user.id
  );
  if (!isPetLinkedToUserResult) {
    redirect({ href: '/pet-not-found', locale });
    return;
  }

  const genders = await getPetGenders();
  const breeds = await getPetBreeds();
  const petDetails = await getPetDetailsForEditById(petId);

  if (!petDetails) {
    redirect({ href: '/pet-not-found', locale });
    return;
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
