'use client';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@radix-ui/react-separator';
import { motion } from 'framer-motion';
import { MapPin, Phone, Star, Send, Heart, HeartOff, Ticket } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { getCommentsForAd, submitComment } from '@/lib/actions/admin';
import { useAuth } from '@/contexts/AuthContext';
import { addToFavorites, removeFromFavorites, isAdFavorited } from '@/lib/firebase/favorites';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { SERVICE_TAGS_TRANSLATIONS } from '@/lib/constants/hebrew-service-tags';

// Real comments will be loaded from the database
const realComments: Array<{
  author: string;
  rating: number;
  text: string;
  date: string;
}> = [];

interface Service {
  location: string;
  image: string;
  name: string;
  tags: string[];
  description: string;
  phone?: string;
  address?: string;
  id?: string; // Add ad ID for comments
}

interface ServiceCardProps {
  service: Service;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const t = useTranslations('pages.ServicesPage');
  const router = useRouter();
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  // Function to translate tags for display
  const translateTag = (tag: string): string => {
    if (locale === 'en' && SERVICE_TAGS_TRANSLATIONS[tag as keyof typeof SERVICE_TAGS_TRANSLATIONS]) {
      return SERVICE_TAGS_TRANSLATIONS[tag as keyof typeof SERVICE_TAGS_TRANSLATIONS];
    }
    return tag;
  };
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Array<{
    id: string;
    userName: string;
    content: string;
    rating: number;
    createdAt: Date;
  }>>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  
  const { user } = useAuth();

  // Load comments when drawer opens
  useEffect(() => {
    if (open && service.id) {
      loadComments();
    }
  }, [open, service.id]);

  // Check if service is favorited when user changes
  useEffect(() => {
    if (user && service.id) {
      checkIfFavorited();
    }
  }, [user, service.id]);

  const checkIfFavorited = async () => {
    if (!user || !service.id) return;
    
    try {
      const favorited = await isAdFavorited(user, service.id);
      setIsFavorited(favorited);
    } catch (error) {
      console.error('Error checking if favorited:', error);
    }
  };

  const loadComments = async () => {
    if (!service.id) return;
    
    setIsLoadingComments(true);
    try {
      console.log('Loading comments for service ID:', service.id);
      console.log('Service ID length:', service.id.length);
      console.log('Service ID type:', typeof service.id);
      const commentsData = await getCommentsForAd(service.id);
      console.log('Comments loaded:', commentsData);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setShowCommentForm(false);
    setUserRating(0);
    setCommentText('');
  };

  const handleStarClick = (rating: number) => {
    setUserRating(rating);
  };

  const handleSubmitComment = async () => {
    if (!user) {
      alert('Please log in to write a review');
      return;
    }
    
    if (userRating > 0 && service.id) {
      setIsSubmittingComment(true);
      
      try {
        const result = await submitComment({
          adId: service.id,
          adTitle: service.name,
          userName: user.displayName || user.email?.split('@')[0] || 'User',
          userEmail: user.email || '',
          content: commentText.trim() || '', // Allow empty content
          rating: userRating
        });

        if (result.success) {
          // Reset form
          setUserRating(0);
          setCommentText('');
          setShowCommentForm(false);
          
          // Reload comments to show the new one
          await loadComments();
          
          alert('תגובתך נשלחה בהצלחה!');
        } else {
          alert('שגיאה בשליחת התגובה. אנא נסה שוב.');
        }
      } catch (error) {
        console.error('Error submitting comment:', error);
        alert('שגיאה בשליחת התגובה. אנא נסה שוב.');
      } finally {
        setIsSubmittingComment(false);
      }
    } else {
      alert('אנא בחר דירוג');
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      alert('Please log in to add to favorites');
      return;
    }

    if (!service.id) {
      alert('Service ID not available');
      return;
    }

    setIsTogglingFavorite(true);
    
    try {
      if (isFavorited) {
        const result = await removeFromFavorites(user, service.id);
        if (result.success) {
          setIsFavorited(false);
        } else {
          alert('Failed to remove from favorites');
        }
      } else {
        const result = await addToFavorites(user, service.id, service.name, 'service');
        if (result.success) {
          setIsFavorited(true);
        } else {
          alert('Failed to add to favorites');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <>
      {/* Card View */}
      <div
        onClick={handleOpen}
        className={cn(
          'relative cursor-pointer overflow-hidden rounded-2xl bg-white shadow-md transition hover:shadow-lg'
        )}
      >
        <div className="flex h-full">
          {/* Service name, description preview and tags */}
          <div className="flex w-2/3 flex-col rounded-2xl p-4">
            <div className="text-lg font-bold mb-2">{service.name}</div>
            {/* Description preview */}
            {service.description && service.description.trim() !== '' && (
              <div className="text-sm text-gray-600 line-clamp-2 mb-auto">
                {service.description}
              </div>
            )}
            {service.tags && service.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {service.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-primary rounded-full px-2 py-1 text-xs text-white"
                  >
                    {translateTag(tag)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Service image */}
          <div className="w-1/3 min-h-[140px] overflow-hidden">
            <img
              src={service.image}
              alt={service.name}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Drawer with service details */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="flex max-h-[90dvh] flex-col sm:max-w-[425px]">
          {/* Scrollable content */}
          <div className="mx-4 mt-4 flex-1 overflow-x-hidden overflow-y-auto rounded-t-[10px]">
            <DrawerHeader className="ltr:text-left rtl:text-right">
              <DrawerTitle className="text-3xl">
                {service.name}
              </DrawerTitle>
              {service.description && service.description.trim() !== '' && (
                <DrawerDescription className="text-base">
                  {service.description}
                </DrawerDescription>
              )}
              {/* Tags */}
              {service.tags && service.tags.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {service.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-primary rounded-full px-2 py-1 text-xs text-white w-fit"
                    >
                      {translateTag(tag)}
                    </span>
                  ))}
                </div>
              )}
            </DrawerHeader>
            {/* Service photo */}
            <div className="mt-3">
              <img
                src={service.image}
                alt={service.name}
                className="h-48 w-full rounded-md object-cover"
              />
            </div>
            
            {/* Contact Information */}
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold">פרטי התקשרות</h4>
              {service.phone && service.phone.trim() !== '' && service.phone !== 'undefined' && service.phone !== 'null' && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="text-gray-500" />
                  <span>{service.phone}</span>
                </div>
              )}
              {(service.address || service.location) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-gray-500" />
                  <span>{service.address || service.location}</span>
                </div>
              )}
            </div>
            {/* Google Reviews */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">ביקורות Google</h3>
                {user ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCommentForm(!showCommentForm)}
                  >
                    הוסף ביקורת
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alert('עליך להתחבר כדי לכתוב ביקורת')}
                  >
                    הוסף ביקורת
                  </Button>
                )}
              </div>
              
              {/* Comment Form */}
              {showCommentForm && (
                <div className="mt-4 rounded-lg border p-4 bg-gray-50">
                  <h4 className="font-semibold mb-3">הוסף ביקורת חדשה</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>דירוג</Label>
                      <div className="flex gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={20}
                            className={cn(
                              'cursor-pointer transition-colors',
                              star <= userRating
                                ? 'fill-orange-400 text-orange-400'
                                : 'text-gray-300 hover:text-orange-300'
                            )}
                            onClick={() => handleStarClick(star)}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="comment">תגובה (אופציונלי)</Label>
                      <Textarea
                        id="comment"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="שתף את החוויה שלך... (אופציונלי)"
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSubmitComment} size="sm" disabled={isSubmittingComment}>
                        <Send size={16} className="mr-2" />
                        {isSubmittingComment ? 'שולח...' : 'שלח'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowCommentForm(false)}
                      >
                        ביטול
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {isLoadingComments ? (
                <div className="mt-4 text-center py-4 text-gray-500">
                  <p>טוען ביקורות...</p>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="mt-2 border-b border-gray-200 p-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{comment.userName}</span>
                      <span className="ml-2 flex items-center gap-1 text-sm text-gray-600">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            className={
                              i < comment.rating
                                ? 'fill-orange-400 text-orange-400'
                                : 'fill-gray-400 text-gray-400'
                            }
                          />
                        ))}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{comment.content}</p>
                    <span className="text-xs text-gray-400">
                      {comment.createdAt.toLocaleDateString('he-IL')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="mt-4 text-center py-4 text-gray-500">
                  <p>אין עדיין ביקורות עבור השירות הזה</p>
                  <p className="text-sm">היה הראשון לכתוב ביקורת!</p>
                </div>
              )}
            </div>
          </div>
          {/* Sticky footer */}
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              delay: 0.2
            }}
            className="sticky bottom-0 z-20 rounded-t-[10px] bg-white shadow-md"
          >
            <DrawerFooter>
              <div className="flex justify-around">
                <Button
                  variant="ghost"
                  size="icon"
                  className="focus:bg-primary transition-colors focus:text-white focus:outline-none"
                  onClick={() => {
                    if (service.address) {
                      const encodedAddress = encodeURIComponent(service.address);
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                    } else {
                      alert('כתובת לא זמינה');
                    }
                  }}
                  title={t('navigation') || 'Navigation'}
                >
                  <MapPin size={20} />
                </Button>
                <Separator
                  orientation="vertical"
                  className="w-[1px] bg-gray-300"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="focus:bg-primary transition-colors focus:text-white focus:outline-none"
                  onClick={() => {
                    if (service.phone && service.phone.trim() !== '' && service.phone !== 'undefined' && service.phone !== 'null') {
                      window.open(`tel:${service.phone}`, '_self');
                    } else {
                      alert('מספר טלפון לא זמין');
                    }
                  }}
                  title={t('call') || 'Call'}
                >
                  <Phone size={20} />
                </Button>
                <Separator
                  orientation="vertical"
                  className="w-[1px] bg-gray-300"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className={`transition-colors focus:outline-none ${
                    isFavorited 
                      ? 'text-red-500 hover:text-red-600 focus:text-red-600' 
                      : 'hover:text-red-500 focus:text-red-500'
                  }`}
                  onClick={handleToggleFavorite}
                  disabled={isTogglingFavorite}
                  title={isFavorited ? t('removeFromFavorites') : t('addToFavorites')}
                >
                  {isTogglingFavorite ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isFavorited ? (
                    <Heart size={20} className="fill-current" />
                  ) : (
                    <HeartOff size={20} />
                  )}
                </Button>
                <Separator
                  orientation="vertical"
                  className="w-[1px] bg-gray-300"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="focus:bg-primary transition-colors focus:text-white focus:outline-none"
                  onClick={() => {
                    if (service.id) {
                      router.push(`/${locale}/promos?businessId=${service.id}`);
                    } else {
                      toast.error('Business ID not available');
                    }
                  }}
                  title={t('coupons') || 'Vouchers'}
                >
                  <Ticket size={20} />
                </Button>
              </div>
            </DrawerFooter>
          </motion.div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default ServiceCard;
