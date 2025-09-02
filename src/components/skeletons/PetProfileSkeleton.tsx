import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Menu } from 'lucide-react';

const PetProfileSkeleton = () => {
  return (
    <>
      {/* Navbar Skeleton - matches exact Navbar structure */}
      <nav className="bg-background sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between rtl:flex-row-reverse">
            {/* Brand / Logo */}
            <div className="flex cursor-pointer items-center">
              <Skeleton className="h-8 w-20" />
            </div>

            {/* Right side buttons */}
            <div className="flex rtl:flex-row-reverse">
              {/* Menu button skeleton */}
              <div className="inline-flex items-center justify-center rounded-md p-2">
                <Menu className="block h-6 w-6 text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Pet Card Skeleton - matches exact PetCard structure */}
      <div className="relative overflow-hidden">
        <div className="mt-3 flex flex-col items-center justify-center px-4">
          <Card className="relative flex w-full flex-col overflow-hidden rounded-3xl border-none shadow-md">
            <CardContent className="relative p-0">
              {/* Pet Image Skeleton */}
              <Skeleton className="h-[220px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Animated content area - matches motion.div structure */}
      <div className="flex flex-grow flex-col">
        {/* Tabs Skeleton - matches AnimatedTabs structure */}
        <div className="mt-6 mb-2 flex justify-center">
          <div className={`flex w-full max-w-[350px] justify-between`}>
            {/* Pet tab */}
            <div className="relative rounded-full px-3 py-1.5">
              <div className="absolute inset-0 z-[-1] rounded-full bg-white" />
              <div className="flex items-center gap-1 text-black">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-8" />
              </div>
            </div>

            <div className="relative rounded-full px-3 py-1.5">
              <div className="flex items-center gap-1 text-gray-500">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-8" />
              </div>
            </div>

            {/* Owner tab */}
            <div className="relative rounded-full px-3 py-1.5">
              <div className="flex items-center gap-1 text-gray-500">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-5 w-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Area Skeleton - matches TabContent structure */}
        <div className="to-background flex h-full w-full grow rounded-t-3xl bg-linear-to-b from-white">
          <div className="relative flex w-full justify-center overflow-hidden">
            <div className="w-full max-w-[350px]">
              <Card className="mx-auto mt-4 w-[325px] border-none bg-transparent shadow-none">
                <CardContent className="p-0">
                  <div className="space-y-0.5">
                    {/* Detail rows skeleton - matches exact TabContent structure */}
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex min-h-[22px] items-start"
                      >
                        <Skeleton className="h-5 w-[76px]" />
                        <Skeleton className="ml-2 h-5 w-32 max-w-56" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Share Button Skeleton - matches exact ShareButton structure */}
      <div className="relative">
        <div className="fixed bottom-4 z-70 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gray-300 p-0 ltr:right-4 rtl:left-4"></div>
      </div>
    </>
  );
};

export default PetProfileSkeleton;
