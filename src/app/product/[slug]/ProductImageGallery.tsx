"use client";
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function ProductImageGallery({ product }: { product: any }) {
  // Use only images_full_url for gallery and thumbnails (match Flutter app logic)
  const imagesFullUrl = product.images_full_url || [];
  // State for main image (index-based for robust switching)
  const [mainImageIdx, setMainImageIdx] = useState(0);

  // When product or images change, reset main image to the first
  useEffect(() => {
    setMainImageIdx(0);
  }, [product]);

  const mainImage = imagesFullUrl[mainImageIdx]?.path || null;

  // Listen for color selection via window event (simple cross-component communication)
  useEffect(() => {
    function handleColorSelect(e: any) {
      if (e.detail && e.detail.colorCode) {
        // Try to find color image in color_images_full_url
        const colorImages = product.color_images_full_url || [];
        const colorImg = colorImages.find((img: any) => img.color?.toLowerCase() === e.detail.colorCode?.replace('#','').toLowerCase());
        if (colorImg && colorImg.image_name?.path) {
          // If the color image is in images_full_url, switch to its index
          const idx = imagesFullUrl.findIndex((img: any) => img.path === colorImg.image_name.path);
          if (idx !== -1) {
            setMainImageIdx(idx);
          } else {
            // Otherwise, temporarily show the color image (not in thumbnails)
            setTempMainImage(colorImg.image_name.path);
          }
        }
      }
    }
    window.addEventListener('product-color-select', handleColorSelect);
    return () => window.removeEventListener('product-color-select', handleColorSelect);
  }, [product, imagesFullUrl]);

  // Support for showing a temp main image if color image is not in images_full_url
  const [tempMainImage, setTempMainImage] = useState<string|null>(null);
  useEffect(() => { setTempMainImage(null); }, [mainImageIdx, product]);

  // Thumbnail click handler
  const handleThumbClick = (idx: number) => {
    setMainImageIdx(idx);
    setTempMainImage(null);
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
        {(tempMainImage || mainImage) ? (
          <Image
            src={tempMainImage || mainImage}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-2">
        {imagesFullUrl.map((img: any, idx: number) => (
          <div key={idx} className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer border-2"
            style={{ borderColor: mainImageIdx === idx && !tempMainImage ? '#2563eb' : 'transparent' }}
            onClick={() => handleThumbClick(idx)}
          >
            <Image
              src={img.path}
              alt={`${product.name} - Image ${idx + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
} 