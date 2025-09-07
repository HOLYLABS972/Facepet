'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getUserFromFirestore } from '@/lib/firebase/users';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { deleteUser, updateUserRole, restrictUser, unrestrictUser } from '@/lib/actions/admin';
import { updateUserInFirestore } from '@/lib/firebase/users';
import { MoreHorizontal, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function UserActions({
  userId,
  currentRole,
  isSuperAdmin,
  isRestricted,
  phoneNumber,
  userAddress
}: {
  userId: string;
  currentRole: string;
  isSuperAdmin: boolean;
  isRestricted?: boolean;
  phoneNumber?: string;
  userAddress?: string;
}) {
  const t = useTranslations('Admin.userActions');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newRole, setNewRole] = useState(currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [restrictionReason, setRestrictionReason] = useState('');
  const [showRestrictionReasonInput, setShowRestrictionReasonInput] = useState(false);
  const [phone, setPhone] = useState(phoneNumber || '');
  const [currentAddress, setCurrentAddress] = useState(userAddress || '');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleRestrictionToggle = async (checked: boolean) => {
    if (!checked && !restrictionReason) {
      setShowRestrictionReasonInput(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (checked) {
        await unrestrictUser(userId);
      } else {
        await restrictUser(userId, restrictionReason);
      }
      setShowRestrictionReasonInput(false);
      setRestrictionReason('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update restriction status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Update role if changed
      if (newRole !== currentRole) {
        await updateUserRole(userId, newRole as 'user' | 'admin' | 'super_admin');
      }

      // Update phone and address if changed
      if (phone !== phoneNumber || currentAddress !== userAddress) {
        const result = await updateUserInFirestore(userId, { 
          ...(phone !== phoneNumber ? { phone } : {}),
          ...(currentAddress !== userAddress ? { address: currentAddress } : {})
        });
        if (!result.success) {
          throw new Error(result.error || 'Failed to update user information');
        }
      }

      setIsEditOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle opening the edit dialog and closing the dropdown
  const handleOpenEditDialog = async () => {
    setIsDropdownOpen(false);
    setIsLoading(true);
    
    try {
      const userResult = await getUserFromFirestore(userId);
      if (userResult.success && userResult.user) {
        setPhone(userResult.user.phone || '');
        setCurrentAddress(userResult.user.address || '');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false);
      setIsEditOpen(true);
    }
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
            Edit
          </DropdownMenuItem>
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
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Manage user role, restrictions, and contact information</DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : (
              <>
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label>User Role</Label>
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

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label>Address</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={currentAddress}
                      onChange={(e) => setCurrentAddress(e.target.value)}
                      placeholder="Enter address"
                    />
                  </div>
                </div>

                {/* Restriction Status */}
              </>
            )}
            <div className="space-y-2">
              <Label>Account Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={!isRestricted}
                  onCheckedChange={(checked) => {
                    if (!checked && !restrictionReason) {
                      setShowRestrictionReasonInput(true);
                    } else {
                      handleRestrictionToggle(checked);
                    }
                  }}
                />
                <span>{isRestricted ? 'Restricted' : 'Active'}</span>
              </div>
            </div>

            {/* Restriction Reason Input */}
            {showRestrictionReasonInput && (
              <div className="space-y-2">
                <Label>Restriction Reason</Label>
                <Textarea
                  value={restrictionReason}
                  onChange={(e) => setRestrictionReason(e.target.value)}
                  placeholder="Enter reason for restriction"
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
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

    </div>
  );
}
