'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';
import ServiceCard from '../ServiceCard';
import { Input } from '../ui/input';

interface Ad {
  id: string;
  title: string;
  type: string;
  content: string;
  duration: number;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  phone?: string;
  location?: string;
  description?: string;
  tags?: string[];
  reviews?: any[];
  averageRating?: number;
  totalReviews?: number;
}

interface ServicesPageProps {
  ads: Ad[];
}



// Function to convert ad to service format
const convertAdToService = (ad: Ad) => {
  return {
    id: ad.id, // Add ad ID for comments
    location: ad.location || 'ישראל',
    image: ad.content || 'https://via.placeholder.com/300x200?text=Service+Image',
    name: ad.title,
    // Use real tags from the ad - if no tags exist, use empty array instead of fallback
    tags: ad.tags || [],
    // Use real description from the ad - if no description exists, use empty string instead of fallback
    description: ad.description || '',
    phone: ad.phone || '',
    address: ad.location || ''
  };
};

const ServicesPage: React.FC<ServicesPageProps> = ({ ads }) => {
  const t = useTranslations('pages.ServicesPage');
  const [search, setSearch] = useState('');

  // Convert ads to services
  const services = ads.map(convertAdToService);

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(search.toLowerCase()) ||
    service.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">{t('title')}</h1>
      <div className="relative mb-4 h-9 rounded-lg bg-white">
        <Search
          className="absolute top-1/2 -translate-y-1/2 transform text-gray-400 ltr:left-3 rtl:right-3"
          size={16}
        />
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg p-2 pl-10"
        />
      </div>
      {filteredServices.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">{t('noResults')}</p>
          {ads.length === 0 && (
            <p className="text-sm text-gray-400 mt-2">No active services available at the moment.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filteredServices.map((service, index) => (
            <ServiceCard key={`${service.name}-${index}`} service={service} />
          ))}
        </div>
      )}
    </>
  );
};

export default ServicesPage;
