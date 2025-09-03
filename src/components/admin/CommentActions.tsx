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
import { deleteComment } from '@/lib/actions/admin';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function CommentActions({
  commentId,
  content
}: {
  commentId: string;
  content: string;
}) {

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await deleteComment(commentId);

      if (!result.success) {
        setError(result.error || 'Failed to delete comment');
      } else {
        setIsDeleting(false);
        router.refresh();
      }
    } catch (err) {
      setError('Failed to delete comment');
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
              setTimeout(() => setIsDeleting(true), 10);
            }}
            className="text-red-600 hover:text-red-700 focus:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Comment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 p-3 bg-gray-50 rounded border">
            <p className="text-sm text-gray-700">
              <strong>Comment:</strong> {content}
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
              {isSubmitting ? 'Deleting...' : 'Delete Comment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
