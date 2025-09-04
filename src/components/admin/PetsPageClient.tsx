'use client';

import { useState } from 'react';
import { DataTablePagination } from '@/components/admin/DataTablePagination';
import { LimitSelector } from '@/components/admin/LimitSelector';
import PetActions from '@/components/admin/PetActions';
import AddTypeModal from '@/components/admin/AddTypeModal';
import AddBreedModal from '@/components/admin/AddBreedModal';
import EditableTableCell from '@/components/admin/EditableTableCell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ArrowDown, ArrowUp, Search } from 'lucide-react';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  imageUrl: string;
  ownerName: string;
  ownerId: string;
  createdAt: Date;
}

interface PetsPageClientProps {
  pets: Pet[];
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  };
}

export default function PetsPageClient({ pets, searchParams }: PetsPageClientProps) {
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showAddBreedModal, setShowAddBreedModal] = useState(false);
  const [petsData, setPetsData] = useState(pets);

  // Parse query parameters
  const pageParam = searchParams?.page;
  const limitParam = searchParams?.limit;
  const searchParam = searchParams?.search;
  const sortParam = searchParams?.sort;
  const orderParam = searchParams?.order;

  const page = parseInt(pageParam || '1');
  const limit = parseInt(limitParam || '10');
  const search = searchParam || '';
  const sort = sortParam || 'name';
  const order = (orderParam as 'asc' | 'desc') || 'asc';

  // Apply search filter
  let filteredPets = petsData;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredPets = petsData.filter(pet => 
      pet.name.toLowerCase().includes(searchLower) ||
      pet.type.toLowerCase().includes(searchLower) ||
      pet.breed.toLowerCase().includes(searchLower) ||
      pet.ownerName.toLowerCase().includes(searchLower)
    );
  }

  // Apply sorting
  filteredPets.sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sort) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      case 'breed':
        aValue = a.breed;
        bValue = b.breed;
        break;
      case 'createdAt':
        aValue = a.createdAt;
        bValue = b.createdAt;
        break;
      default:
        aValue = a.createdAt;
        bValue = b.createdAt;
    }

    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Apply pagination
  const totalCount = filteredPets.length;
  const offset = (page - 1) * limit;
  const paginatedPets = filteredPets.slice(offset, offset + limit);

  // Helper function to safely format dates
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return format(new Date(date), 'yyyy-MM-dd');
  };

  // Handle pet field updates
  const handlePetUpdate = (petId: string, field: 'type' | 'breed', newValue: string) => {
    setPetsData(prevPets => 
      prevPets.map(pet => 
        pet.id === petId 
          ? { ...pet, [field]: newValue }
          : pet
      )
    );
  };

  // Helper function to generate sort URL
  const getSortUrl = (field: string) => {
    const newOrder = sort === field && order === 'asc' ? 'desc' : 'asc';
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sort: field,
      order: newOrder
    });
    if (search) params.set('search', search);
    return `?${params.toString()}`;
  };

  // Helper function to generate pagination URL
  const getPaginationUrl = (newPage: number) => {
    const params = new URLSearchParams({
      page: newPage.toString(),
      limit: limit.toString(),
      sort,
      order
    });
    if (search) params.set('search', search);
    return `?${params.toString()}`;
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold">Manage Pets</h1>
        <div className="mt-4 flex space-x-2 sm:mt-0">
          <Button 
            onClick={() => setShowAddTypeModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Type
          </Button>
          <Button 
            onClick={() => setShowAddBreedModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Add Breed
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <form action={`/admin/pets`} method="GET">
            <Input
              type="text"
              name="search"
              placeholder="Search by name, type, breed, or owner..."
              defaultValue={search}
              className="bg-white pr-4 pl-10"
            />
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
            <input type="hidden" name="sort" value={sort} />
            <input type="hidden" name="order" value={order} />
            <Button type="submit" className="sr-only">
              Search
            </Button>
          </form>
        </div>

        <div className="flex items-center space-x-2">
          <LimitSelector
            currentLimit={limit}
            baseUrl="/admin/pets"
            searchParams={{
              sort,
              order,
              ...(search ? { search } : {})
            }}
          />
        </div>
      </div>

      {/* Pets Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <a href={getSortUrl('name')} className="flex items-center">
                  Name
                  {sort === 'name' && (
                    <span className="ml-1">
                      {order === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </a>
              </TableHead>
              <TableHead>
                <a href={getSortUrl('type')} className="flex items-center">
                  Type
                  {sort === 'type' && (
                    <span className="ml-1">
                      {order === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </a>
              </TableHead>
              <TableHead>
                <a href={getSortUrl('breed')} className="flex items-center">
                  Breed
                  {sort === 'breed' && (
                    <span className="ml-1">
                      {order === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </a>
              </TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Owner Name</TableHead>
              <TableHead>
                <a href={getSortUrl('createdAt')} className="flex items-center">
                  Created
                  {sort === 'createdAt' && (
                    <span className="ml-1">
                      {order === 'asc' ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </span>
                  )}
                </a>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No pets found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedPets.map((pet) => (
                <TableRow key={pet.id}>
                  <TableCell className="font-medium">{pet.name}</TableCell>
                  <TableCell>
                    <EditableTableCell
                      value={pet.type}
                      field="type"
                      petId={pet.id}
                      currentType={pet.type}
                      onUpdate={handlePetUpdate}
                    />
                  </TableCell>
                  <TableCell>
                    <EditableTableCell
                      value={pet.breed}
                      field="breed"
                      petId={pet.id}
                      currentType={pet.type}
                      onUpdate={handlePetUpdate}
                    />
                  </TableCell>
                  <TableCell>
                    {pet.imageUrl ? (
                      <img 
                        src={pet.imageUrl} 
                        alt={pet.name}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{pet.ownerName}</TableCell>
                  <TableCell>{formatDate(pet.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <PetActions petId={pet.id} petName={pet.name} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination
        currentPage={page}
        totalPages={Math.ceil(totalCount / limit)}
        baseUrl="/admin/pets"
        searchParams={{
          limit: limit.toString(),
          sort,
          order,
          ...(search ? { search } : {})
        }}
      />

      {/* Modals */}
      <AddTypeModal 
        isOpen={showAddTypeModal} 
        onClose={() => setShowAddTypeModal(false)} 
      />
      <AddBreedModal 
        isOpen={showAddBreedModal} 
        onClose={() => setShowAddBreedModal(false)} 
      />
    </div>
  );
}
