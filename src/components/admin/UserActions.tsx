'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { deleteUser, updateUserRole, restrictUser, unrestrictUser } from '@/lib/actions/admin';
import { MoreHorizontal } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UserActions({
  userId,
  currentRole,
  isSuperAdmin,
  isRestricted
}: {
  userId: string;
  currentRole: string;
  isSuperAdmin: boolean;
  isRestricted?: boolean;
}) {
  const t = useTranslations('Admin.userActions');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newRole, setNewRole] = useState(currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [isRestricting, setIsRestricting] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');

  const router = useRouter();

  const handleRoleChange = async () => {
    if (newRole === currentRole) {
      setIsEditOpen(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await updateUserRole(userId, newRole as 'user' | 'admin' | 'super_admin');
      setIsEditOpen(false);
      router.refresh();
    } catch (err) {
      setError('Failed to update role');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmation) {
      setIsDeleting(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await deleteUser(userId);

      if (!result.success) {
        setError(result.error || 'Failed to delete user');
      } else {
        setIsDeleting(false);
        router.refresh();
      }
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestrictUser = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await restrictUser(userId, restrictionReason);
      if (result.success) {
        setIsRestricting(false);
        setRestrictionReason('');
        router.refresh();
      } else {
        setError(result.error || 'Failed to restrict user');
      }
    } catch (err) {
      setError('Failed to restrict user');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnrestrictUser = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await unrestrictUser(userId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'Failed to unrestrict user');
      }
    } catch (err) {
      setError('Failed to unrestrict user');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle opening the edit dialog and closing the dropdown
  const handleOpenEditDialog = () => {
    setIsDropdownOpen(false);
    // Small timeout to ensure dropdown closes before dialog opens
    setTimeout(() => {
      setIsEditOpen(true);
    }, 10);
  };

  return (
    <div className="relative">
      {/* Dropdown Menu */}
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleOpenEditDialog}>
            Edit Role
          </DropdownMenuItem>
          {isRestricted ? (
            <DropdownMenuItem
              onClick={() => {
                setIsDropdownOpen(false);
                handleUnrestrictUser();
              }}
              className="text-green-600 hover:text-green-700 focus:text-green-700"
            >
              Unrestrict User
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => {
                setIsDropdownOpen(false);
                setIsRestricting(true);
              }}
              className="text-orange-600 hover:text-orange-700 focus:text-orange-700"
            >
              Restrict User
            </DropdownMenuItem>
          )}
          {!isSuperAdmin && (
            <DropdownMenuItem
              onClick={() => {
                setIsDropdownOpen(false);
                setTimeout(() => handleDelete(), 10);
              }}
              className="text-red-600 hover:text-red-700 focus:text-red-700"
            >
              Delete User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Role Dialog - completely separate from dropdown */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          if (!open) {
            setNewRole(currentRole);
            setError(null);
          }
          setIsEditOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <Select
              value={newRole}
              onValueChange={(value) => setNewRole(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - completely separate from dropdown */}
      <Dialog
        open={isDeleting}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmation(false);
            setError(null);
          }
          setIsDeleting(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('confirmDeletion')}</DialogTitle>
            <DialogDescription>
              {t('deleteUserMessage')}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteConfirmation(true);
                handleDelete();
              }}
            >
              {t('deleteUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restrict User Dialog */}
      <Dialog
        open={isRestricting}
        onOpenChange={(open) => {
          if (!open) {
            setRestrictionReason('');
            setError(null);
          }
          setIsRestricting(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restrict User</DialogTitle>
            <DialogDescription>
              This will prevent the user from logging in. They will see a message that their account has been restricted.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Restriction Reason (optional)
            </label>
            <Input
              value={restrictionReason}
              onChange={(e) => setRestrictionReason(e.target.value)}
              placeholder="Enter reason for restriction..."
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestricting(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRestrictUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Restricting...' : 'Restrict User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
