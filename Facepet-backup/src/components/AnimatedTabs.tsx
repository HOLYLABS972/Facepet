import { motion } from 'framer-motion';
import { PawPrint, Stethoscope, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

export type TabName = 'pet' | 'owner' | 'vet';

interface AnimatedTabsProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  showVetTab?: boolean;
}

const AnimatedTabs = ({
  activeTab,
  onTabChange,
  showVetTab
}: AnimatedTabsProps) => {
  const t = useTranslations('pages.PetProfilePage');

  // Build the tabs array. Only include the Vet tab if showVetTab is true.
  const baseTabs = [
    {
      id: 'pet',
      label: (
        <div className="flex items-center gap-1">
          <PawPrint className="h-5 w-5" />
          {t('tabs.pet')}
        </div>
      )
    },
    {
      id: 'owner',
      label: (
        <div className="flex items-center gap-1">
          <User className="h-5 w-5" />
          {t('tabs.owner')}
        </div>
      )
    }
  ];
  if (showVetTab) {
    baseTabs.push({
      id: 'vet',
      label: (
        <div className="flex items-center gap-1">
          <Stethoscope className="h-5 w-5" />
          {t('tabs.vet')}
        </div>
      )
    });
  }

  return (
    <div
      className={`flex w-full justify-between ${showVetTab ? 'max-w-[350px]' : 'max-w-[250px]'}`}
    >
      {baseTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id as TabName)}
          className={`relative rounded-full px-3 py-1.5 text-lg font-normal transition focus-visible:outline-2 ${
            activeTab === tab.id
              ? 'text-black'
              : 'text-gray-500 hover:text-black'
          }`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          {activeTab === tab.id && (
            <motion.span
              layoutId="bubble"
              className="absolute inset-0 z-[-1] rounded-full bg-white"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.8 }}
            />
          )}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default AnimatedTabs;
