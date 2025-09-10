'use client';

import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams: Record<string, string>;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams
}: DataTablePaginationProps) {
  const router = useRouter();

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  // Helper function to generate pagination URL
  const getPaginationUrl = (newPage: number) => {
    const params = new URLSearchParams();

    // Add all existing search params
    for (const [key, value] of Object.entries(searchParams)) {
      if (key !== 'page') {
        params.set(key, value);
      }
    }

    // Set the new page
    params.set('page', newPage.toString());

    return `${baseUrl}?${params.toString()}`;
  };

  // Navigate to a specific page
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    router.push(getPaginationUrl(page));
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // If we have fewer pages than the max to show, display all pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always include first page
      pageNumbers.push(1);

      // Calculate start and end of the middle section
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the start
      if (currentPage <= 3) {
        endPage = Math.min(totalPages - 1, 4);
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(2, totalPages - 3);
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pageNumbers.push(-1); // -1 represents ellipsis
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push(-2); // -2 represents ellipsis
      }

      // Always include last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-muted-foreground flex-1 text-sm">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToPage(1)}
          disabled={!canGoPrevious}
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToPage(currentPage - 1)}
          disabled={!canGoPrevious}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {getPageNumbers().map((pageNum, i) => {
          // Render ellipsis
          if (pageNum < 0) {
            return (
              <Button
                key={`ellipsis-${i}`}
                variant="outline"
                size="icon"
                disabled
                className="cursor-default"
              >
                ...
              </Button>
            );
          }

          // Render page number
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? 'default' : 'outline'}
              size="icon"
              className={currentPage === pageNum ? 'bg-primary' : 'bg-white'}
              onClick={() => goToPage(pageNum)}
              aria-label={`Go to page ${pageNum}`}
              aria-current={currentPage === pageNum ? 'page' : undefined}
            >
              {pageNum}
            </Button>
          );
        })}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToPage(currentPage + 1)}
          disabled={!canGoNext}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => goToPage(totalPages)}
          disabled={!canGoNext}
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
