import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface TabContentSkeletonProps {
  rows?: number;
}

const TabContentSkeleton = ({ rows = 4 }: TabContentSkeletonProps) => {
  return (
    <div className="relative flex w-full justify-center overflow-hidden">
      <div className="w-full max-w-[350px]">
        <Card className="mx-auto mt-4 w-[325px] border-none bg-transparent shadow-none">
          <CardContent className="p-0">
            <div className="space-y-0.5">
              {Array.from({ length: rows }).map((_, index) => (
                <div key={index} className="flex min-h-[22px] items-start">
                  <Skeleton className="h-5 w-[76px] text-lg font-light" />
                  <Skeleton className="ml-2 h-5 w-40 max-w-56 text-lg font-medium" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TabContentSkeleton;
