'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Audience } from '@/types/promo';
import { getAudiences, updateAudience, deleteAudience } from '@/lib/actions/admin';
import EditAudienceDialog from './EditAudienceDialog';


export default function AudiencesFloatingChips() {
  const t = useTranslations('Admin');
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

  const handleToggleActive = async (audience: Audience, e: React.MouseEvent) => {
    e.stopPropagation();
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
    setEditingAudience(audience);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    fetchAudiences();
    setIsEditDialogOpen(false);
    setEditingAudience(null);
  };

  const handleDelete = async (audience: Audience, e: React.MouseEvent) => {
    e.stopPropagation();
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

  // Handle click to edit
  const handleChipClick = (e: React.MouseEvent, audience: Audience) => {
    e.stopPropagation();
    handleEdit(audience);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Loading audiences...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl border-2 border-red-400 bg-red-50 text-red-700">
        {error}
      </div>
    );
  }

  if (audiences.length === 0) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="text-center">
          <div className="text-6xl mb-4">
            🎯
          </div>
          <p className="text-xl text-gray-500">No audiences yet</p>
          <p className="text-sm text-gray-400 mt-2">Create your first audience to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Grid Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {audiences.map((audience) => {
          return (
            <div
              key={audience.id}
              onClick={(e) => handleChipClick(e, audience)}
              className={`
                relative px-4 py-3 rounded-lg cursor-pointer border
                transition-all duration-200 hover:scale-105 hover:shadow-lg
                ${audience.isActive 
                  ? 'bg-primary text-white shadow-md border-primary' 
                  : 'bg-gray-200 text-gray-700 shadow-sm border-gray-300'
                }
              `}
            >
              {/* Chip content */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm truncate flex-1">
                  {audience.name}
                </span>
                
                {/* Status indicator */}
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${audience.isActive ? 'bg-white' : 'bg-gray-400'}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Dialog */}
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

