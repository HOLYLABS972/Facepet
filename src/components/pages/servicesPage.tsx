'use client';

import { Search } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { FilterChips, FilterChip } from '../ui/filter-chips';
import { TagsFilter } from '../ui/tags-filter';
import { useAuth } from '@/contexts/AuthContext';
import { getUserFavorites, getAllAdTags } from '@/lib/firebase/favorites';
import { SERVICE_TAGS_TRANSLATIONS } from '@/lib/constants/hebrew-service-tags';
import ServicesMapView from './ServicesMapView';

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
const convertAdToService = (ad: Ad & { imageUrl?: string }) => {
  return {
    id: ad.id, // Add ad ID for comments
    location: ad.location || 'ישראל',
    image: ad.imageUrl || ad.content || 'https://via.placeholder.com/300x200?text=Service+Image',
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
  const locale = useLocale();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [favoriteAdIds, setFavoriteAdIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'favorites'>('all');
  const [isLoadingTags, setIsLoadingTags] = useState(true);

  // Function to translate tags for display
  const translateTag = (tag: string): string => {
    if (locale === 'en' && SERVICE_TAGS_TRANSLATIONS[tag as keyof typeof SERVICE_TAGS_TRANSLATIONS]) {
      return SERVICE_TAGS_TRANSLATIONS[tag as keyof typeof SERVICE_TAGS_TRANSLATIONS];
    }
    return tag;
  };

  // Convert ads to services
  const services = ads.map(convertAdToService);

  // Load available tags and user favorites
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load available tags
        const tags = await getAllAdTags();
        setAvailableTags(tags);
        setIsLoadingTags(false);

        // Load user favorites if logged in
        if (user) {
          const favorites = await getUserFavorites(user);
          setFavoriteAdIds(favorites.map(fav => fav.adId));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoadingTags(false);
      }
    };

    loadData();
  }, [user]);

  // Filter services based on search, tags, and favorites
  const filteredServices = services.filter((service) => {
    // Search filter
    const matchesSearch = service.name.toLowerCase().includes(search.toLowerCase()) ||
      service.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));

    // Tags filter
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(selectedTag => service.tags.includes(selectedTag));

    // Favorites filter
    const matchesFavorites = filterType === 'all' || 
      (filterType === 'favorites' && favoriteAdIds.includes(service.id || ''));

    return matchesSearch && matchesTags && matchesFavorites;
  });

  // Filter chips configuration
  const filterChips: FilterChip[] = [
    {
      id: 'all',
      label: t('filters.all'),
      active: filterType === 'all'
    },
    {
      id: 'favorites',
      label: t('filters.favorites'),
      active: filterType === 'favorites'
    }
  ];

  const handleChipClick = (chipId: string) => {
    setFilterType(chipId as 'all' | 'favorites');
  };


  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>
      
      {/* Search Bar */}
      <div className="relative mb-4 h-9 rounded-lg bg-white">
        <Search
          className="absolute top-1/2 -translate-y-1/2 transform text-gray-400 ltr:left-3 rtl:right-3"
          size={16}
        />
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg p-2 ltr:pl-10 rtl:pr-10"
        />
      </div>

      {/* Filter Chips and Tags Filter in same row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FilterChips 
          chips={filterChips} 
          onChipClick={handleChipClick}
        />
        {!isLoadingTags && availableTags.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <TagsFilter
              tags={availableTags}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              placeholder={t('tagsFilter.placeholder')}
              clearAllText={t('tagsFilter.clearAll')}
              className="w-full"
              translateTag={translateTag}
            />
          </div>
        )}
      </div>

      {/* Combined Map and List View */}
        <div className="w-full" style={{ height: 'calc(100vh - 400px)', minHeight: '500px' }}>
          {filteredServices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('noResults')}</p>
              {ads.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">No active services available at the moment.</p>
              )}
              {filterType === 'favorites' && favoriteAdIds.length === 0 && (
                <p className="text-sm text-gray-400 mt-2">You haven't added any services to favorites yet.</p>
              )}
            </div>
          ) : (
            <ServicesMapView services={filteredServices} />
          )}
        </div>
    </>
  );
};

export default ServicesPage;
