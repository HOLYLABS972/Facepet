import PetProfilePage from '@/components/PetProfilePage';
import PetProfileSkeleton from '@/components/skeletons/PetProfileSkeleton';
import { fetchRandomAd } from '@/lib/actions/ads-server';
import { redirect } from '@/src/i18n/routing';
import { getPetDetailsById } from '@/utils/database/queries/pets';
import { UUID } from 'crypto';
import { getLocale } from 'next-intl/server';
import { Suspense } from 'react';

interface PetPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function PetContent({ id }: { id: string }) {
  // Fetch pet data and ad data in parallel
  const [pet, adData] = await Promise.all([
    getPetDetailsById(id as UUID),
    fetchRandomAd()
  ]);

  const locale = await getLocale();

  if (!pet) {
    redirect({ href: `/pet/${id}/get-started`, locale });
    return;
  }

  // Transform ad data to match the expected format
  const initialAd =
    adData && adData.content
      ? {
          id: adData.id,
          type: adData.type as 'image' | 'video',
          content: adData.content,
          duration: adData.duration || 5
        }
      : null;

  return <PetProfilePage pet={pet} initialAd={initialAd} />;
}

export default async function PetPage({ params }: PetPageProps) {
  const id = (await params).id;

  return (
    <Suspense fallback={<PetProfileSkeleton />}>
      <PetContent id={id} />
    </Suspense>
  );
}
