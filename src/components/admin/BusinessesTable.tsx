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
import { MoreHorizontal, Edit, Trash2, Mail, Phone, MapPin, Image, Building2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Business } from '@/types/promo';
import { getBusinesses, updateBusiness, deleteBusiness } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';
import EditBusinessDialog from './EditBusinessDialog';
import { cn } from '@/lib/utils';

export default function BusinessesTable() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Handle window resize to update isMobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // Desktop side card view
  if (!isMobile) {
    return (
      <div className="w-full h-[calc(100vh-300px)] relative flex">
        {/* Desktop Side Panel */}
        <div className="hidden md:flex flex-col w-96 h-full bg-white shadow-lg z-20 border-r border-gray-200">
          <div className="p-4 border-b border-gray-100 bg-white">
            <h3 className="font-semibold text-lg">{t('businessManagement.title')}</h3>
            <p className="text-sm text-gray-500 mt-1">{businesses.length} {t('businessManagement.businesses') || 'businesses'}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {businesses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{t('businessManagement.noBusinesses')}</p>
              </div>
            ) : (
              businesses.map((business) => (
                <div
                  key={business.id}
                  className={cn(
                    "bg-white rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md",
                    selectedBusiness?.id === business.id ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200"
                  )}
                  onClick={() => setSelectedBusiness(business)}
                >
                  <div className="flex gap-3">
                    <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
                      {business.imageUrl ? (
                        <img
                          src={business.imageUrl}
                          alt={business.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm mb-1 truncate">{business.name}</h3>
                        <Badge variant={business.isActive ? 'default' : 'secondary'} className="text-xs">
                          {business.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {business.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                          {business.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Phone size={12} />
                          <span className="truncate">{business.contactInfo.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Content Area - Business Details */}
        <div className="flex-1 overflow-y-auto p-6 md:pl-6">
          {selectedBusiness ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Business Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{selectedBusiness.name}</h2>
                  <Badge variant={selectedBusiness.isActive ? 'default' : 'secondary'} className="mb-4">
                    {selectedBusiness.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  {selectedBusiness.description && (
                    <p className="text-gray-600 mb-4">{selectedBusiness.description}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(selectedBusiness)}>
                      <Edit className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                      {t('businessManagement.edit')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(selectedBusiness)}>
                      {selectedBusiness.isActive ? t('businessManagement.deactivate') : t('businessManagement.activate')}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(selectedBusiness)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                      {t('businessManagement.delete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Business Image */}
              {selectedBusiness.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={selectedBusiness.imageUrl}
                    alt={selectedBusiness.name}
                    className="w-full h-auto max-h-96 object-cover"
                  />
                </div>
              )}

              {/* Contact Information */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedBusiness.contactInfo.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{selectedBusiness.contactInfo.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{selectedBusiness.contactInfo.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedBusiness.tags && selectedBusiness.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedBusiness.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="border-t pt-4 text-sm text-gray-500">
                <p>Created: {formatDate(selectedBusiness.createdAt)}</p>
                <p>Last Updated: {formatDate(selectedBusiness.updatedAt)}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Select a business to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile table view
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
