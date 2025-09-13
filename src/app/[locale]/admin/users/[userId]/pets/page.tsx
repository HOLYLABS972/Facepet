import { getPetsByUserEmail } from '@/lib/actions/admin';
import { getUserFromFirestore } from '@/lib/firebase/users';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PawPrint } from 'lucide-react';
import Link from 'next/link';
import PetsPageClient from '@/components/admin/PetsPageClient';

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
  const { userId } = params;
  
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
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">User's Pets</h1>
            <p className="text-gray-600">
              Pets owned by <span className="font-medium">{user.fullName || user.email}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Pets count */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <PawPrint className="h-4 w-4" />
          <span>{pets.length} pet{pets.length !== 1 ? 's' : ''} found</span>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pets found</h3>
          <p className="text-gray-500">
            This user hasn't registered any pets yet.
          </p>
        </div>
      )}
    </div>
  );
}
