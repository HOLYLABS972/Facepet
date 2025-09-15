'use client';


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
import { deleteContactSubmission, updateContactSubmissionReadStatus } from '@/lib/actions/admin';
import { MoreHorizontal, Eye, EyeOff, Trash2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { type ContactSubmission } from '@/lib/actions/admin';
import { useTranslations } from 'next-intl';

export default function ContactSubmissionActions({
  submissionId,
  isRead,
  submission
}: {
  submissionId: string;
  isRead: boolean;
  submission: ContactSubmission;
}) {
  const t = useTranslations('Admin');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await deleteContactSubmission(submissionId);

      if (!result.success) {
        setError(result.error || t('contactSubmissions.errors.deleteFailed'));
      } else {
        setIsDeleting(false);
        router.refresh();
      }
    } catch (err) {
      setError(t('contactSubmissions.errors.deleteFailed'));
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReadStatusChange = async (read: boolean) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateContactSubmissionReadStatus(submissionId, read);

      if (!result.success) {
        setError(result.error || t('contactSubmissions.errors.updateStatusFailed'));
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(t('contactSubmissions.errors.updateStatusFailed'));
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t('contactSubmissions.actions.openMenu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t('contactSubmissions.actions.actions')}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              setIsDropdownOpen(false);
              setIsViewing(true);
            }}
            className="text-blue-600 hover:text-blue-700 focus:text-blue-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            {t('contactSubmissions.actions.viewDetails')}
          </DropdownMenuItem>
          {!isRead ? (
            <DropdownMenuItem
              onClick={() => {
                setIsDropdownOpen(false);
                handleReadStatusChange(true);
              }}
              className="text-green-600 hover:text-green-700 focus:text-green-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              {t('contactSubmissions.actions.markAsRead')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => {
                setIsDropdownOpen(false);
                handleReadStatusChange(false);
              }}
              className="text-yellow-600 hover:text-yellow-700 focus:text-yellow-700"
            >
              <EyeOff className="h-4 w-4 mr-2" />
              {t('contactSubmissions.actions.markAsUnread')}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => {
              setIsDropdownOpen(false);
              setTimeout(() => setIsDeleting(true), 10);
            }}
            className="text-red-600 hover:text-red-700 focus:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('contactSubmissions.actions.deleteSubmission')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Details Dialog */}
      <Dialog
        open={isViewing}
        onOpenChange={(open) => {
          if (!open) {
            setError(null);
          }
          setIsViewing(open);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t('contactSubmissions.viewDialog.title')}
            </DialogTitle>
            <DialogDescription>
              {t('contactSubmissions.viewDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('contactSubmissions.viewDialog.name')}</label>
                <p className="text-sm text-gray-900">{submission.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('contactSubmissions.viewDialog.email')}</label>
                <p className="text-sm text-gray-900">{submission.email}</p>
              </div>
            </div>

            {submission.phone && (
              <div>
                <label className="text-sm font-medium text-gray-700">{t('contactSubmissions.viewDialog.phone')}</label>
                <p className="text-sm text-gray-900">{submission.phone}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">{t('contactSubmissions.viewDialog.message')}</label>
              <div className="mt-1 p-3 bg-gray-50 rounded border text-sm text-gray-900 whitespace-pre-wrap">
                {submission.message}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">{t('contactSubmissions.viewDialog.submitted')}</label>
                <p className="text-sm text-gray-900">
                  {new Date(submission.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">{t('contactSubmissions.viewDialog.status')}</label>
                <p className="text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      submission.isRead
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {submission.isRead ? t('contactSubmissions.table.read') : t('contactSubmissions.table.unread')}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewing(false)}>
              {t('contactSubmissions.viewDialog.close')}
            </Button>
            {!isRead && (
              <Button onClick={() => handleReadStatusChange(true)}>
                {t('contactSubmissions.viewDialog.markAsRead')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleting}
        onOpenChange={(open) => {
          if (!open) {
            setError(null);
          }
          setIsDeleting(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('contactSubmissions.deleteDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('contactSubmissions.deleteDialog.description')}
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 p-3 bg-gray-50 rounded border">
            <p className="text-sm text-gray-700">
              <strong>{t('contactSubmissions.deleteDialog.from')}</strong> {submission.name} ({submission.email})
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              {t('contactSubmissions.deleteDialog.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? t('contactSubmissions.deleteDialog.deleting') : t('contactSubmissions.deleteDialog.deleteSubmission')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
