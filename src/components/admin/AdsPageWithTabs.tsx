'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Megaphone, Filter } from 'lucide-react';

// Import new promo components
import AddPromoForm from '@/components/admin/AddPromoForm';
import PromosTable from '@/components/admin/PromosTable';

// Import new business and filter components
import AddBusinessForm from '@/components/admin/AddBusinessForm';
import BusinessesTable from '@/components/admin/BusinessesTable';
import AddFilterForm from '@/components/admin/AddFilterForm';
import FiltersTable from '@/components/admin/FiltersTable';

// Import table components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface AdsPageProps {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    tab?: string;
  };
}

export default function AdsPage({ searchParams }: AdsPageProps) {
  const t = useTranslations('Admin');
  const [activeTab, setActiveTab] = useState(searchParams.tab || 'promo');

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">{t('adsManagement.title')}</h1>
        <p className="text-gray-600 mt-2 text-sm md:text-base">{t('adsManagement.description')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 overflow-x-auto">
          <TabsTrigger value="promo" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            {t('adsManagement.tabs.promo')}
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t('adsManagement.tabs.filters') || 'Filters'}
          </TabsTrigger>
          <TabsTrigger value="businesses" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {t('adsManagement.tabs.businesses')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="promo" className="space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 rtl:md:flex-row-reverse">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {t('promoManagement.title')}
              </h2>
              <p className="text-gray-600 mt-2 text-sm md:text-base">
                {t('promoManagement.description')}
              </p>
            </div>
            <AddPromoForm />
          </div>
          
          <PromosTable />
        </TabsContent>

        <TabsContent value="filters" className="space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 rtl:md:flex-row-reverse">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {t('filterManagement.title') || 'Filter Management'}
              </h2>
              <p className="text-gray-600 mt-2 text-sm md:text-base">
                {t('filterManagement.description') || 'Create and manage filters from audiences to filter businesses.'}
              </p>
            </div>
            <AddFilterForm />
          </div>
          
          <FiltersTable />
        </TabsContent>

        <TabsContent value="businesses" className="space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 rtl:md:flex-row-reverse">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {t('businessManagement.title')}
              </h2>
              <p className="text-gray-600 mt-2 text-sm md:text-base">
                {t('businessManagement.description')}
              </p>
            </div>
            <AddBusinessForm />
          </div>
          
          <BusinessesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
