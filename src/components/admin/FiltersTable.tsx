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
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Filter, Audience } from '@/types/promo';
import { getFilters, updateFilter, deleteFilter, getAudiences } from '@/lib/actions/admin';
import EditFilterDialog from './EditFilterDialog';

export default function FiltersTable() {
  const t = useTranslations('Admin');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingFilter, setEditingFilter] = useState<Filter | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [filtersResult, audiencesResult] = await Promise.all([
        getFilters(),
        getAudiences()
      ]);
      
      if (filtersResult.success) {
        setFilters(filtersResult.filters);
      } else {
        setError(filtersResult.error || 'Failed to fetch filters');
      }

      if (audiencesResult.success) {
        setAudiences(audiencesResult.audiences);
      }
    } catch (err) {
      setError('Failed to fetch filters');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (filter: Filter) => {
    try {
      const result = await updateFilter(filter.id, { isActive: !filter.isActive });
      if (result.success) {
        setFilters(prev => 
          prev.map(f => 
            f.id === filter.id ? { ...f, isActive: !f.isActive } : f
          )
        );
      } else {
        setError(result.error || 'Failed to update filter');
      }
    } catch (err) {
      setError('Failed to update filter');
      console.error(err);
    }
  };

  const handleEdit = (filter: Filter) => {
    console.log('Edit clicked for filter:', filter);
    setEditingFilter(filter);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    fetchData();
    setIsEditDialogOpen(false);
    setEditingFilter(null);
  };

  const handleDelete = async (filter: Filter) => {
    if (!confirm(`Are you sure you want to delete the filter "${filter.name}"?`)) {
      return;
    }

    try {
      const result = await deleteFilter(filter.id);
      if (result.success) {
        setFilters(prev => prev.filter(f => f.id !== filter.id));
      } else {
        setError(result.error || 'Failed to delete filter');
      }
    } catch (err) {
      setError('Failed to delete filter');
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

  const getAudienceNames = (audienceIds: string[]) => {
    return audiences
      .filter(a => audienceIds.includes(a.id))
      .map(a => a.name);
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
              <TableHead>{t('filterManagement.name') || 'Name'}</TableHead>
              <TableHead>{t('filterManagement.audiences') || 'Audiences'}</TableHead>
              <TableHead>{t('filterManagement.status') || 'Status'}</TableHead>
              <TableHead>{t('filterManagement.createdAt') || 'Created At'}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  {t('filterManagement.noFilters') || 'No filters found.'}
                </TableCell>
              </TableRow>
            ) : (
              filters.map((filter) => {
                const audienceNames = getAudienceNames(filter.audienceIds);
                return (
                  <TableRow key={filter.id}>
                    <TableCell className="font-medium">{filter.name}</TableCell>
                    <TableCell>
                      {audienceNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {audienceNames.slice(0, 3).map((name, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                          {audienceNames.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{audienceNames.length - 3}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No audiences</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={filter.isActive ? 'default' : 'secondary'}>
                        {filter.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(filter.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(filter)}>
                            <Edit className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                            {t('filterManagement.edit') || 'Edit'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(filter)}>
                            {filter.isActive ? (t('filterManagement.deactivate') || 'Deactivate') : (t('filterManagement.activate') || 'Activate')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(filter)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
                            {t('filterManagement.delete') || 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      {editingFilter && (
        <EditFilterDialog
          filter={editingFilter}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingFilter(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
