'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { MoreHorizontal, Phone, PawPrint } from 'lucide-react';
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
  const t = useTranslations('Admin');
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
      setError(t('userActions.updateRoleError'));
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
        setError(result.error || t('userActions.deleteUserError'));
      } else {
        setIsDeleting(false);
        router.refresh();
      }
    } catch (err) {
      setError(t('userActions.deleteUserError'));
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
        setError(result.error || t('userActions.restrictUserError'));
      }
    } catch (err) {
      setError(t('userActions.restrictUserError'));
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
        setError(result.error || t('userActions.unrestrictUserError'));
      }
    } catch (err) {
      setError(t('userActions.unrestrictUserError'));
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestrictionToggle = async (checked: boolean) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (checked) {
        await unrestrictUser(userId);
      } else {
        await restrictUser(userId, '');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('userActions.updateRestrictionError'));
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
          throw new Error(result.error || t('userActions.updateUserInfoError'));
        }
      }

      setIsEditOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('userActions.saveChangesError'));
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
            <span className="sr-only">{t('userActions.actions')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t('userActions.actions')}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => {
            setIsDropdownOpen(false);
            router.push(`/admin/users/${userId}/pets`);
          }}>
            <PawPrint className="h-4 w-4 mr-2" />
            {t('userActions.viewUser')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenEditDialog}>
            {t('userActions.editUser')}
          </DropdownMenuItem>
          {!isSuperAdmin && (
            <DropdownMenuItem
              onClick={() => {
                setIsDropdownOpen(false);
                setTimeout(() => handleDelete(), 10);
              }}
              className="text-red-600 hover:text-red-700 focus:text-red-700"
            >
              {t('userActions.deleteUser')}
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
            <DialogTitle>{t('userActions.editUser')}</DialogTitle>
            <DialogDescription>{t('userActions.editUserDescription')}</DialogDescription>
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
                  <Label>{t('userActions.userRole')}</Label>
                  <Select
                    value={newRole}
                    onValueChange={(value) => setNewRole(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('userActions.selectRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{t('userActions.roles.user')}</SelectItem>
                      <SelectItem value="admin">{t('userActions.roles.admin')}</SelectItem>
                      <SelectItem value="super_admin">{t('userActions.roles.super_admin')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label>{t('userActions.phoneNumber')}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('userActions.enterPhone')}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label>{t('userActions.address')}</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      value={currentAddress}
                      onChange={(e) => setCurrentAddress(e.target.value)}
                      placeholder={t('userActions.enterAddress')}
                    />
                  </div>
                </div>

                {/* User Status */}
                <div className="space-y-2">
                  <Label>{t('userActions.accountStatus')}</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={!isRestricted}
                      onCheckedChange={(checked) => {
                        handleRestrictionToggle(checked);
                      }}
                    />
                    <span>{isRestricted ? t('userActions.restricted') : t('userActions.active')}</span>
                  </div>
                </div>
              </>
            )}

          </div>

          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              {t('userActions.cancel')}
            </Button>
            <Button onClick={handleSaveChanges} disabled={isSubmitting || isLoading}>
              {isSubmitting ? t('userActions.savingChanges') : t('userActions.saveChanges')}
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
            <DialogTitle>{t('userActions.confirmDeletion')}</DialogTitle>
            <DialogDescription>
              {t('userActions.deleteUserMessage')}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              {t('userActions.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setDeleteConfirmation(true);
                handleDelete();
              }}
            >
              {t('userActions.deleteUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
