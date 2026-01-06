'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { HEBREW_SERVICE_TAGS } from '@/src/lib/constants/hebrew-service-tags';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface BulkEditBusinessDialogProps {
    isOpen: boolean;
    onClose: () => void;
    selectedCount: number;
    onApply: (tagsToAdd: string[], tagsToRemove: string[]) => Promise<void>;
}

export default function BulkEditBusinessDialog({
    isOpen,
    onClose,
    selectedCount,
    onApply
}: BulkEditBusinessDialogProps) {
    const t = useTranslations('Admin');
    const [tagsToAdd, setTagsToAdd] = useState<string[]>([]);
    const [tagsToRemove, setTagsToRemove] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleTagClick = (tag: string) => {
        // If tag is in "to add" list, remove it
        if (tagsToAdd.includes(tag)) {
            setTagsToAdd(prev => prev.filter(t => t !== tag));
            return;
        }

        // If tag is in "to remove" list, remove it from there
        if (tagsToRemove.includes(tag)) {
            setTagsToRemove(prev => prev.filter(t => t !== tag));
            return;
        }

        // Otherwise, add to "to add" list
        setTagsToAdd(prev => [...prev, tag]);
    };

    const handleRemoveTagClick = (tag: string) => {
        // If tag is in "to remove" list, remove it
        if (tagsToRemove.includes(tag)) {
            setTagsToRemove(prev => prev.filter(t => t !== tag));
            return;
        }

        // If tag is in "to add" list, remove it from there
        if (tagsToAdd.includes(tag)) {
            setTagsToAdd(prev => prev.filter(t => t !== tag));
            return;
        }

        // Otherwise, add to "to remove" list
        setTagsToRemove(prev => [...prev, tag]);
    };

    const handleApply = async () => {
        setIsSubmitting(true);
        try {
            await onApply(tagsToAdd, tagsToRemove);
            // Reset state
            setTagsToAdd([]);
            setTagsToRemove([]);
            onClose();
        } catch (error) {
            console.error('Error applying bulk changes:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setTagsToAdd([]);
        setTagsToRemove([]);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader className="text-center pr-8">
                    <DialogTitle className="text-center">
                        {t('businessManagement.bulkEditTitle', { count: selectedCount })}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {t('businessManagement.bulkEditDescription')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Tags to Add Section */}
                    <div className="space-y-2">
                        <Label>{t('businessManagement.addTags')}</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
                            {HEBREW_SERVICE_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleTagClick(tag)}
                                    className={`
                    text-left p-2 rounded text-sm transition-colors
                    ${tagsToAdd.includes(tag)
                                            ? 'bg-green-500 text-white'
                                            : tagsToRemove.includes(tag)
                                                ? 'bg-red-100 text-red-700 line-through'
                                                : 'bg-gray-100 hover:bg-gray-200'
                                        }
                  `}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        {tagsToAdd.length > 0 && (
                            <div className="mt-2">
                                <p className="text-xs text-gray-600 mb-1">
                                    {t('businessManagement.selectedToAdd', { count: tagsToAdd.length })} ({tagsToAdd.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {tagsToAdd.map((tag) => (
                                        <Badge key={tag} className="bg-green-500 text-white">
                                            {tag}
                                            <button
                                                onClick={() => setTagsToAdd(prev => prev.filter(t => t !== tag))}
                                                className="ml-1 hover:bg-green-600 rounded-full p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tags to Remove Section */}
                    <div className="space-y-2">
                        <Label>{t('businessManagement.removeTags')}</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-2">
                            {HEBREW_SERVICE_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => handleRemoveTagClick(tag)}
                                    className={`
                    text-left p-2 rounded text-sm transition-colors
                    ${tagsToRemove.includes(tag)
                                            ? 'bg-red-500 text-white'
                                            : tagsToAdd.includes(tag)
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 hover:bg-gray-200'
                                        }
                  `}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        {tagsToRemove.length > 0 && (
                            <div className="mt-2">
                                <p className="text-xs text-gray-600 mb-1">
                                    {t('businessManagement.selectedToRemove', { count: tagsToRemove.length })} ({tagsToRemove.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {tagsToRemove.map((tag) => (
                                        <Badge key={tag} className="bg-red-500 text-white">
                                            {tag}
                                            <button
                                                onClick={() => setTagsToRemove(prev => prev.filter(t => t !== tag))}
                                                className="ml-1 hover:bg-red-600 rounded-full p-0.5"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleApply}
                        disabled={isSubmitting || (tagsToAdd.length === 0 && tagsToRemove.length === 0)}
                    >
                        {isSubmitting ? t('businessManagement.applying') : t('businessManagement.applyChanges')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
