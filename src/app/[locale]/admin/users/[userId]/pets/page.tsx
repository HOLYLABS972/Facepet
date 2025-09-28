import { getPetsByUserEmail } from '@/lib/actions/admin';
import { getUserFromFirestore } from '@/lib/firebase/users';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PawPrint } from 'lucide-react';
import Link from 'next/link';
import PetsPageClient from '@/components/admin/PetsPageClient';
import { getTranslations } from 'next-intl/server';

interface UserPetsPageProps {
  params: {
    userId: string;
  };
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  };
}

export default async function UserPetsPage({ params, searchParams }: UserPetsPageProps) {
  const { userId } = await params;
  const t = await getTranslations('Admin');
  
  // Get user information
  const userResult = await getUserFromFirestore(userId);
  if (!userResult.success || !userResult.user) {
    redirect('/admin/users');
  }

  const user = userResult.user;
  
  // Get pets for this user
  const pets = await getPetsByUserEmail(user.email);

  return (
    <div className="container mx-auto p-8">
      {/* Header with back button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{t('userPetsPage.title')}</h1>
            <p className="text-gray-600">
              {t('userPetsPage.description')} <span className="font-medium">{(user as any).fullName || user.email}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Pets count */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <PawPrint className="h-4 w-4" />
          <span>{pets.length} {pets.length !== 1 ? t('userPetsPage.petsFoundPlural') : t('userPetsPage.petsFound')}</span>
        </div>
      </div>

      {/* Pets table */}
      {pets.length > 0 ? (
        <PetsPageClient 
          pets={pets} 
          searchParams={searchParams} 
          hideOwnerColumn={true} // Hide owner column since we're already filtering by user
        />
      ) : (
        <div className="rounded-md border bg-white p-8 text-center">
          <PawPrint className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('userPetsPage.noPetsTitle')}</h3>
          <p className="text-gray-500">
            {t('userPetsPage.noPetsDescription')}
          </p>
        </div>
      )}
    </div>
  );
}
