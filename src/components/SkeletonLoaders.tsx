"use client";

// Skeleton loading components that match existing UI design

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden animate-pulse">
      {/* Product Image Skeleton */}
      <div className="relative w-full bg-gray-200" style={{ aspectRatio: '1/1' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer"></div>
      </div>
      
      {/* Product Info Skeleton */}
      <div className="p-4 space-y-3">
        {/* Product Name */}
        <div className="h-5 bg-gray-200 rounded-md animate-shimmer"></div>
        <div className="h-4 bg-gray-200 rounded-md w-3/4 animate-shimmer"></div>
        
        {/* Price */}
        <div className="flex justify-between items-center mt-4">
          <div className="h-6 bg-gray-200 rounded-md w-20 animate-shimmer"></div>
          <div className="h-8 bg-gray-200 rounded-md w-24 animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
}

export function CategoryPillSkeleton() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm bg-white animate-pulse" style={{ minWidth: '80px' }}>
      <div className="w-7 h-7 bg-gray-200 rounded-full animate-shimmer"></div>
      <div className="h-4 bg-gray-200 rounded-md w-16 animate-shimmer"></div>
    </div>
  );
}

export function BannerSkeleton() {
  return (
    <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden bg-gray-200 shadow-lg animate-pulse">
      <div className="w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" style={{ aspectRatio: '16/9' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-8 bg-gray-300 rounded-md w-64 mx-auto animate-shimmer"></div>
            <div className="h-5 bg-gray-300 rounded-md w-48 mx-auto animate-shimmer"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10 justify-items-center max-w-6xl mx-auto">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CategorySectionSkeleton() {
  return (
    <div className="mb-10">
      <div className="flex flex-col items-center my-2">
        {/* Category Title Skeleton */}
        <div className="h-8 bg-gray-200 rounded-md w-48 mb-2 animate-shimmer"></div>
        <div className="w-16 h-1 rounded-full bg-gray-200 mb-2 animate-shimmer"></div>
      </div>
      <ProductGridSkeleton count={3} />
    </div>
  );
}

export function HomepageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Skeleton */}
      <section className="relative bg-white py-6 sm:py-8 lg:py-12">
        <div className="w-full flex justify-center">
          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
            <BannerSkeleton />
          </div>
        </div>
      </section>

      {/* Categories Skeleton */}
      <section className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0 flex justify-center">
          <div className="overflow-x-auto overflow-y-hidden no-scrollbar">
            <div className="flex gap-2 md:gap-3 w-max px-2">
              {Array.from({ length: 6 }, (_, i) => (
                <CategoryPillSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Skeleton */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CategorySectionSkeleton />
          <CategorySectionSkeleton />
        </div>
      </section>
    </div>
  );
}

export function ProductPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center py-2 border-b border-gray-100 min-h-[48px]">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 bg-gray-200 rounded-full animate-shimmer"></div>
            <div className="mx-auto h-6 bg-gray-200 rounded-md w-48 animate-shimmer"></div>
          </div>
        </div>
      </header>

      {/* Product Details Skeleton */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Images Skeleton */}
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-lg animate-shimmer" style={{ aspectRatio: '1/1' }}></div>
              <div className="flex space-x-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="w-16 h-16 bg-gray-200 rounded-md animate-shimmer"></div>
                ))}
              </div>
            </div>

            {/* Product Info Skeleton */}
            <div className="space-y-6">
              <div className="h-8 bg-gray-200 rounded-md w-3/4 animate-shimmer"></div>
              <div className="h-6 bg-gray-200 rounded-md w-1/4 animate-shimmer"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded-md animate-shimmer"></div>
                <div className="h-4 bg-gray-200 rounded-md w-5/6 animate-shimmer"></div>
                <div className="h-4 bg-gray-200 rounded-md w-4/6 animate-shimmer"></div>
              </div>
              <div className="h-12 bg-gray-200 rounded-md animate-shimmer"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ProductsPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="h-7 bg-gray-200 rounded-md w-32 animate-shimmer"></div>
            <div className="hidden md:flex space-x-8 items-center">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-5 bg-gray-200 rounded-md w-16 animate-shimmer"></div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Products Grid Skeleton */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }, (_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Add shimmer animation styles
const shimmerStyles = `
  @keyframes shimmer {
    0% {
      background-position: -200px 0;
    }
    100% {
      background-position: calc(200px + 100%) 0;
    }
  }
  .animate-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200px 100%;
    animation: shimmer 1.5s infinite;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = shimmerStyles;
  document.head.appendChild(styleSheet);
} 