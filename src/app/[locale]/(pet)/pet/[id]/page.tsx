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

  // Fetch random promo instead of ad
  const promo = await getRandomActivePromo();

  return <PetProfilePage pet={result.pet} owner={result.owner} vet={result.vet} initialPromo={promo} />;
}
