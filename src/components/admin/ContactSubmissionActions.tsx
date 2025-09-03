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

export default function ContactSubmissionActions({
  submissionId,
  isRead,
  submission
}: {
  submissionId: string;
  isRead: boolean;
  submission: ContactSubmission;
}) {

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
        setError(result.error || 'Failed to delete submission');
      } else {
        setIsDeleting(false);
        router.refresh();
      }
    } catch (err) {
      setError('Failed to delete submission');
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
        setError(result.error || 'Failed to update read status');
      } else {
        router.refresh();
      }
    } catch (err) {
      setError('Failed to update read status');
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
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              setIsDropdownOpen(false);
              setIsViewing(true);
            }}
            className="text-blue-600 hover:text-blue-700 focus:text-blue-700"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
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
              Mark as Read
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
              Mark as Unread
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
            Delete Submission
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
              Contact Submission Details
            </DialogTitle>
            <DialogDescription>
              Full details of the contact form submission
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900">{submission.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900">{submission.email}</p>
              </div>
            </div>

            {submission.phone && (
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <p className="text-sm text-gray-900">{submission.phone}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">Message</label>
              <div className="mt-1 p-3 bg-gray-50 rounded border text-sm text-gray-900 whitespace-pre-wrap">
                {submission.message}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Submitted</label>
                <p className="text-sm text-gray-900">
                  {new Date(submission.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <p className="text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      submission.isRead
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {submission.isRead ? 'Read' : 'Unread'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewing(false)}>
              Close
            </Button>
            {!isRead && (
              <Button onClick={() => handleReadStatusChange(true)}>
                Mark as Read
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
            <DialogTitle>Delete Contact Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact submission? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 p-3 bg-gray-50 rounded border">
            <p className="text-sm text-gray-700">
              <strong>From:</strong> {submission.name} ({submission.email})
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Submission'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
