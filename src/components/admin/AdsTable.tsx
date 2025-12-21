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
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Ad, getAllAds, AdStatus } from '@/lib/actions/admin';
import AdActions from './AdActions';

export default function AdsTable() {
  const t = useTranslations('Admin');
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const result = await getAllAds(1, 1000); // Get all ads
      if (result.ads) {
        setAds(result.ads);
      } else {
        setError('Failed to fetch ads');
      }
    } catch (err) {
      setError('Failed to fetch ads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: AdStatus) => {
    const statusConfig = {
      active: { label: t('adsManagement.status.active'), className: 'bg-green-100 text-green-800' },
      scheduled: { label: t('adsManagement.status.scheduled'), className: 'bg-yellow-100 text-yellow-800' },
      draft: { label: t('adsManagement.status.draft'), className: 'bg-gray-100 text-gray-800' },
      inactive: { label: t('adsManagement.status.inactive'), className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">{t('loading') || 'Loading...'}</p>
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
              <TableHead>{t('adsManagement.table.title')}</TableHead>
              <TableHead>{t('adsManagement.table.type')}</TableHead>
              <TableHead>{t('adsManagement.table.image')}</TableHead>
              <TableHead>{t('adsManagement.table.status')}</TableHead>
              <TableHead>{t('adsManagement.table.created')}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
              {ads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    {t('adsManagement.table.noAds') || 'No advertisements found.'}
                  </TableCell>
                </TableRow>
            ) : (
              ads.map((ad) => (
                <TableRow key={ad.id}>
                  <TableCell className="font-medium">{ad.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ad.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {ad.content ? (
                      <div className="w-16 h-10 rounded-md overflow-hidden">
                        <img 
                          src={ad.content} 
                          alt={ad.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-10 rounded-md bg-gray-100 flex items-center justify-center">
                        <span className="text-xs text-gray-400">No Image</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(ad.status)}</TableCell>
                  <TableCell>{formatDate(ad.createdAt)}</TableCell>
                  <TableCell>
                    <AdActions ad={ad} onDelete={fetchAds} onUpdate={fetchAds} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

