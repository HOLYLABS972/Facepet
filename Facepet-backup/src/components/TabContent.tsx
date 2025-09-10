import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { TabName } from './AnimatedTabs';

const variants = {
  initial: (direction: number) => ({
    x: direction > 0 ? '40%' : '-40%',
    opacity: 0
  }),
  animate: {
    x: '0%',
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.2,
      duration: 0.8
    }
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-40%' : '40%',
    opacity: 0,
    transition: {
      type: 'spring',
      bounce: 0.2,
      duration: 0.8
    }
  })
};

interface TabContentProps {
  activeTab: TabName;
  lockedDirection: number;
  petInfo: { label: string; value: string }[];
  ownerInfo: { label: string; value: string; link?: string }[];
  vetInfo: { label: string; value: string }[];
}

// Render only details that have a non-empty value.
const renderDetails = (
  details: { label: string; value: string; link?: string }[]
) => {
  const filtered = details.filter((d) => d.value.trim() !== '');
  if (filtered.length === 0) return null;
  return (
    <Card className="mx-auto mt-4 w-[325px] border-none bg-transparent shadow-none">
      <CardContent className="p-0">
        <div className="space-y-0.5">
          {filtered.map((detail, index) => (
            <div key={index} className="flex min-h-[22px] items-start">
              <span className="w-[76px] text-lg font-light text-gray-400">
                {detail.label}
              </span>
              <span className="max-w-56 text-lg font-medium text-black">
                {detail.link ? (
                  <a href={detail.link} className="underline">
                    {detail.value}
                  </a>
                ) : (
                  detail.value
                )}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const TabContent = ({
  activeTab,
  lockedDirection,
  petInfo,
  ownerInfo,
  vetInfo
}: TabContentProps) => {
  let content = null;
  if (activeTab === 'pet') {
    content = renderDetails(petInfo);
  } else if (activeTab === 'owner') {
    content = renderDetails(ownerInfo);
  } else if (activeTab === 'vet') {
    content = renderDetails(vetInfo);
  }

  // Track if the component has mounted.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <div className="relative flex w-full justify-center overflow-hidden">
      <motion.div
        key={activeTab}
        custom={lockedDirection}
        variants={variants}
        initial={hasMounted ? 'initial' : false} // No initial animation on first load.
        animate="animate"
        exit="exit"
        className="w-full max-w-[350px]"
      >
        {content}
      </motion.div>
    </div>
  );
};

export default TabContent;
