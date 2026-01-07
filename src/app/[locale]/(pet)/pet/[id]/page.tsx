import PetProfilePage from '@/components/PetProfilePage';
import { getPetWithConsolidatedOwner } from '@/src/lib/supabase/database/pets';
import { redirect } from 'next/navigation';

interface PetPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function PublicPetPage({ params }: PetPageProps) {
  const { id, locale } = params;

  const result = await getPetWithConsolidatedOwner(id);

  if (!result.success || !result.pet) {
    // Redirect to tag found page for unrecognized pet IDs
    redirect(`/${locale}/pet/${id}/tag-found`);
  }

  return <PetProfilePage pet={result.pet} owner={result.owner} vet={result.vet} />;
}
