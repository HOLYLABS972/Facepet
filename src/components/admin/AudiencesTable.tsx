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
import { Audience } from '@/types/promo';
import { getAudiences, updateAudience, deleteAudience } from '@/lib/actions/admin';
import { useRouter } from 'next/navigation';
import EditAudienceDialog from './EditAudienceDialog';

export default function AudiencesTable() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAudience, setEditingAudience] = useState<Audience | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchAudiences();
  }, []);

  const fetchAudiences = async () => {
    try {
      setLoading(true);
      const result = await getAudiences();
      if (result.success) {
        setAudiences(result.audiences);
      } else {
        setError(result.error || 'Failed to fetch audiences');
      }
    } catch (err) {
      setError('Failed to fetch audiences');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (audience: Audience) => {
    try {
      const result = await updateAudience(audience.id, { isActive: !audience.isActive });
      if (result.success) {
        setAudiences(prev => 
          prev.map(a => 
            a.id === audience.id ? { ...a, isActive: !a.isActive } : a
          )
        );
      } else {
        setError(result.error || 'Failed to update audience');
      }
    } catch (err) {
      setError('Failed to update audience');
      console.error(err);
    }
  };

  const handleEdit = (audience: Audience) => {
    console.log('Edit clicked for audience:', audience);
    setEditingAudience(audience);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    fetchAudiences();
    setIsEditDialogOpen(false);
    setEditingAudience(null);
  };

  const handleDelete = async (audience: Audience) => {
    if (!confirm(`Are you sure you want to delete the audience "${audience.name}"?`)) {
      return;
    }

    try {
      const result = await deleteAudience(audience.id);
      if (result.success) {
        setAudiences(prev => prev.filter(a => a.id !== audience.id));
      } else {
        setError(result.error || 'Failed to delete audience');
      }
    } catch (err) {
      setError('Failed to delete audience');
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
              <TableHead>{t('audienceManagement.name')}</TableHead>
              <TableHead>{t('audienceManagement.description')}</TableHead>
              <TableHead>Target Criteria</TableHead>
              <TableHead>{t('audienceManagement.status')}</TableHead>
              <TableHead>{t('audienceManagement.createdAt')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audiences.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {t('audienceManagement.noAudiences')}
                </TableCell>
              </TableRow>
            ) : (
              audiences.map((audience) => (
                <TableRow key={audience.id}>
                  <TableCell className="font-medium">{audience.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {audience.description}
                  </TableCell>
                  <TableCell>
                    {audience.targetCriteria.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {audience.targetCriteria.slice(0, 2).map((criteria, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {criteria}
                          </Badge>
                        ))}
                        {audience.targetCriteria.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{audience.targetCriteria.length - 2}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No criteria</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={audience.isActive ? 'default' : 'secondary'}>
                      {audience.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(audience.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(audience)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(audience)}>
                          {audience.isActive ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(audience)}
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
      
      {editingAudience && (
        <EditAudienceDialog
          audience={editingAudience}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingAudience(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
