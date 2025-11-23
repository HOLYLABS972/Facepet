import PetProfilePage from '@/components/PetProfilePage';
import { getPetWithConsolidatedOwner } from '@/src/lib/firebase/consolidated-pet-creation';
import { getRandomActivePromo } from '@/lib/actions/admin';
import { redirect } from 'next/navigation';

interface PetPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function PublicPetPage({ params }: PetPageProps) {
  const { id, locale } = await params;
  
  const result = await getPetWithConsolidatedOwner(id);
  
  if (!result.success || !result.pet) {
    // Redirect to tag found page for unrecognized pet IDs
    redirect(`/${locale}/pet/${id}/tag-found`);
  }

  // Get user's audience IDs for filtering
  const userAudienceIds = result.owner?.audienceIds || [];

  // Fetch random promo filtered by user audiences
  const promo = await getRandomActivePromo(userAudienceIds);

  return <PetProfilePage pet={result.pet} owner={result.owner} vet={result.vet} initialPromo={promo} />;
}
