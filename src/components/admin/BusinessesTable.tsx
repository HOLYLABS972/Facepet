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
import { MoreHorizontal, Edit, Trash2, Mail, Phone, MapPin, Image } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Business } from '@/types/promo';
import { getBusinesses, updateBusiness, deleteBusiness } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';
import EditBusinessDialog from './EditBusinessDialog';

export default function BusinessesTable() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const result = await getBusinesses();
      if (result.success) {
        setBusinesses(result.businesses);
      } else {
        setError(result.error || 'Failed to fetch businesses');
      }
    } catch (err) {
      setError('Failed to fetch businesses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (business: Business) => {
    try {
      const result = await updateBusiness(business.id, { isActive: !business.isActive });
      if (result.success) {
        setBusinesses(prev => 
          prev.map(b => 
            b.id === business.id ? { ...b, isActive: !b.isActive } : b
          )
        );
      } else {
        setError(result.error || 'Failed to update business');
      }
    } catch (err) {
      setError('Failed to update business');
      console.error(err);
    }
  };

  const handleEdit = (business: Business) => {
    console.log('Edit clicked for business:', business);
    setEditingBusiness(business);
    setIsEditOpen(true);
  };

  const handleEditSuccess = () => {
    fetchBusinesses();
    setIsEditOpen(false);
    setEditingBusiness(null);
  };

  const handleDelete = async (business: Business) => {
    if (!confirm(`Are you sure you want to delete the business "${business.name}"?`)) {
      return;
    }

    try {
      const result = await deleteBusiness(business.id);
      if (result.success) {
        setBusinesses(prev => prev.filter(b => b.id !== business.id));
      } else {
        setError(result.error || 'Failed to delete business');
      }
    } catch (err) {
      setError('Failed to delete business');
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
              <TableHead>{t('businessManagement.name')}</TableHead>
              <TableHead>{t('businessManagement.description')}</TableHead>
              <TableHead>{t('businessManagement.image')}</TableHead>
              <TableHead>{t('businessManagement.contactInfo')}</TableHead>
              <TableHead>{t('businessManagement.status')}</TableHead>
              <TableHead>{t('businessManagement.createdAt')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  {t('businessManagement.noBusinesses')}
                </TableCell>
              </TableRow>
            ) : (
              businesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell className="font-medium">{business.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {business.description}
                  </TableCell>
                  <TableCell>
                    {business.imageUrl ? (
                      <div className="w-10 h-10 rounded-md overflow-hidden">
                        <img 
                          src={business.imageUrl} 
                          alt={business.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                        <Image className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-gray-400" />
                        <span className="truncate max-w-[150px]">{business.contactInfo.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-gray-400" />
                        <span>{business.contactInfo.phone}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="truncate max-w-[150px]">{business.contactInfo.address}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={business.isActive ? 'default' : 'secondary'}>
                      {business.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(business.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(business)}>
                          <Edit className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                          {t('businessManagement.edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(business)}>
                          {business.isActive ? t('businessManagement.deactivate') : t('businessManagement.activate')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(business)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                          {t('businessManagement.delete')}
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
      
      {editingBusiness && (
        <EditBusinessDialog
          business={editingBusiness}
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingBusiness(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
