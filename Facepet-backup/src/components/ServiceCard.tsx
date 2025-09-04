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
import { Separator } from '@radix-ui/react-separator';
import { motion } from 'framer-motion';
import { MapPin, Phone, Star } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '../lib/utils';

// Define mock Google Reviews data
const googleReviewsMock = [
  {
    author: 'יוסי כהן',
    rating: 5,
    text: 'וטרינר מקצועי וסבלני, טיפל בכלב שלי במסירות והסביר לי כל שלב בתהליך. ממליץ בחום!',
    date: '15 במרץ 2023'
  },
  {
    author: 'רונית לוי',
    rating: 4,
    text: 'מקום נקי ומסודר, צוות נחמד מאוד. רק חבל שהייתי צריכה לחכות קצת יותר מדי זמן.',
    date: '1 באפריל 2023'
  },
  {
    author: 'אבי ישראלי',
    rating: 5,
    text: 'הצילו את החתול שלי ממצב מסוכן, תודה ענקית לצוות המסור והמקצועי!',
    date: '10 במאי 2023'
  },
  {
    author: 'דנה מור',
    rating: 3,
    text: 'שירות טוב, אבל המחירים קצת יקרים ביחס למקומות אחרים שבדקתי.',
    date: '22 ביוני 2023'
  },
  {
    author: 'נועם פרידמן',
    rating: 5,
    text: 'הוטרינר הכי טוב שהייתי אצלו, הכלבה שלי מרגישה הרבה יותר טוב אחרי הביקור!',
    date: '5 בספטמבר 2023'
  }
];

interface Service {
  location: string;
  image: string;
  name: string;
  tags: string[];
  description: string;
}

interface ServiceCardProps {
  service: Service;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
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
        <div className="flex">
          {/* Service name and tags */}
          <div className="flex w-2/3 flex-col justify-between rounded-2xl p-4">
            <div className="text-lg font-bold">{service.name}</div>
            <div className="my-1 flex flex-wrap gap-2">
              {service.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-primary rounded-full px-2 py-1 text-xs text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Service image */}
          <div className="w-1/3">
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
                <div className="flex items-center justify-between">
                  {service.name}
                  <Star
                    size={24}
                    className="cursor-pointer hover:text-orange-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      const target = e.currentTarget;
                      target.classList.toggle('fill-orange-400');
                      target.classList.toggle('text-orange-400');
                    }}
                  />
                </div>
              </DrawerTitle>
              <DrawerDescription className="text-base">
                {service.description}
              </DrawerDescription>
              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-2">
                {service.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="bg-primary rounded-full px-2 py-1 text-xs text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </DrawerHeader>
            {/* Service photo */}
            <div className="mt-3">
              <img
                src={service.image}
                alt={service.name}
                className="h-48 w-full rounded-md object-cover"
              />
            </div>
            {/* Google Reviews */}
            <div className="mt-5">
              <h3 className="text-xl font-bold">ביקורות Google</h3>
              {googleReviewsMock.map((review, idx) => (
                <div key={idx} className="mt-2 border-b border-gray-200 p-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{review.author}</span>
                    <span className="ml-2 flex items-center gap-1 text-sm text-gray-600">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i < review.rating
                              ? 'fill-orange-400 text-orange-400'
                              : 'fill-gray-400 text-gray-400'
                          }
                        />
                      ))}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{review.text}</p>
                  <span className="text-xs text-gray-400">{review.date}</span>
                </div>
              ))}
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
                  className="focus:bg-primary flex items-center gap-2 transition-colors focus:text-white focus:outline-none"
                >
                  <MapPin size={16} />
                  ניווט
                </Button>
                <Separator
                  orientation="vertical"
                  className="w-[1px] bg-gray-300"
                />
                <Button
                  variant="ghost"
                  className="focus:bg-primary flex items-center gap-2 transition-colors focus:text-white focus:outline-none"
                >
                  <Star size={16} />
                  דירוג
                </Button>
                <Separator
                  orientation="vertical"
                  className="w-[1px] bg-gray-300"
                />
                <Button
                  variant="ghost"
                  className="focus:bg-primary flex items-center gap-2 transition-colors focus:text-white focus:outline-none"
                >
                  <Phone size={16} />
                  התקשר
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
