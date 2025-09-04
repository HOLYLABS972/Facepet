import PetsPageClient from '@/components/admin/PetsPageClient';
import { getAllPetsForAdmin } from '@/lib/actions/admin';

export default async function PetsPage({
  searchParams
}: {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  };
}) {
  // Fetch pets with pagination
  const pets = await getAllPetsForAdmin();

  return (
    <PetsPageClient 
      pets={pets} 
      searchParams={searchParams} 
    />
  );
}
