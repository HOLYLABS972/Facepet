'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, Eye, Image } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Promo, Business, Audience } from '@/types/promo';
import { getPromos, getBusinesses, getAudiences, updatePromo, deletePromo } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';
import EditPromoDialog from './EditPromoDialog';

export default function PromosTable() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [promosResult, businessesResult, audiencesResult] = await Promise.all([
        getPromos(),
        getBusinesses(),
        getAudiences()
      ]);

      if (promosResult.success) {
        setPromos(promosResult.promos);
      } else {
        setError(promosResult.error || 'Failed to fetch promos');
      }

      if (businessesResult.success) {
        setBusinesses(businessesResult.businesses);
      }

      if (audiencesResult.success) {
        setAudiences(audiencesResult.audiences);
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (promo: Promo) => {
    try {
      const result = await updatePromo(promo.id, { isActive: !promo.isActive });
      if (result.success) {
        setPromos(prev => 
          prev.map(p => 
            p.id === promo.id ? { ...p, isActive: !p.isActive } : p
          )
        );
      } else {
        setError(result.error || 'Failed to update promo');
      }
    } catch (err) {
      setError('Failed to update promo');
      console.error(err);
    }
  };

  const handleEdit = (promo: Promo) => {
    console.log('Edit clicked for promo:', promo);
    setEditingPromo(promo);
    setIsEditOpen(true);
  };

  const handleEditSuccess = () => {
    fetchData();
    setIsEditOpen(false);
    setEditingPromo(null);
  };

  const handleDelete = async (promo: Promo) => {
    if (!confirm(t('promoManagement.confirmDelete', { name: promo.name }))) {
      return;
    }

    try {
      const result = await deletePromo(promo.id);
      if (result.success) {
        setPromos(prev => prev.filter(p => p.id !== promo.id));
      } else {
        setError(result.error || 'Failed to delete promo');
      }
    } catch (err) {
      setError('Failed to delete promo');
      console.error(err);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getBusinessName = (businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    return business ? business.name : 'Unknown Business';
  };

  const getAudienceName = (audienceId: string) => {
    const audience = audiences.find(a => a.id === audienceId);
    return audience ? audience.name : 'Unknown Audience';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded border border-red-400 bg-red-100 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('promoManagement.name')}</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>{t('promoManagement.description')}</TableHead>
              <TableHead>{t('promoManagement.business')}</TableHead>
              <TableHead>{t('promoManagement.audience')}</TableHead>
              <TableHead>{t('promoManagement.status')}</TableHead>
              <TableHead>{t('promoManagement.createdAt')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  {t('promoManagement.noPromos')}
                </TableCell>
              </TableRow>
            ) : (
              promos.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell className="font-medium">{promo.name}</TableCell>
                  <TableCell>
                    {promo.imageUrl ? (
                      <div className="w-12 h-12 rounded-md overflow-hidden">
                        <img 
                          src={promo.imageUrl} 
                          alt={promo.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center">
                        <Image className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {promo.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getBusinessName(promo.businessId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getAudienceName(promo.audienceId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={promo.isActive ? 'default' : 'secondary'}>
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(promo.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(promo)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(promo)}>
                          {promo.isActive ? t('promoManagement.deactivate') : t('promoManagement.activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(promo)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {editingPromo && (
        <EditPromoDialog
          promo={editingPromo}
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingPromo(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
