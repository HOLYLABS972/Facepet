import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from '@/components/ui/drawer';
import { useMediaQuery } from '@custom-react-hooks/use-media-query';
import { Edit2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';
import { Button } from '../ui/button';

type ConfirmProfileChangesProps = {
  onConfirm: () => void;
  loading: boolean;
};

export function ConfirmProfileChanges({
  onConfirm,
  loading
}: ConfirmProfileChangesProps) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const t = useTranslations('components.ConfirmProfileChanges');

  const handleConfirm = () => {
    onConfirm();
    setOpen(false);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="lg"
            type="button"
            disabled={loading}
            className="bg-primary h-[60px] w-[60px] rounded-full p-0 hover:bg-[#ff6243]/90"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Edit2 />}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader className="rtl:text-right">
            <DialogTitle>{t('title')}</DialogTitle>
            <DialogDescription>{t('description')}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => setOpen(false)} variant="outline">
              {t('cancelButton')}
            </Button>
            <Button onClick={handleConfirm} disabled={loading}>
              {t('confirmButton')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="lg"
          type="button"
          disabled={loading}
          className="bg-primary h-[60px] w-[60px] rounded-full p-0 hover:bg-[#ff6243]/90"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Edit2 />}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left rtl:text-right">
          <DrawerTitle>{t('title')}</DrawerTitle>
          <DrawerDescription>{t('description')}</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter className="flex flex-row justify-end gap-2 pt-2">
          <DrawerClose asChild>
            <Button variant="outline">{t('cancelButton')}</Button>
          </DrawerClose>
          <Button
            className="bg-primary"
            onClick={handleConfirm}
            disabled={loading}
          >
            {t('confirmButton')}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
