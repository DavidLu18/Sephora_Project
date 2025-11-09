// src/components/reviews/StarRating.tsx
"use client";
import { Star, StarHalf, StarOff } from "lucide-react";

interface StarRatingProps {
  rating: number; // 0–5 (có thể có .5)
}

export default function StarRating({ rating }: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center text-yellow-400">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} fill="currentColor" stroke="none" className="w-4 h-4" />
      ))}
      {hasHalfStar && (
        <StarHalf key="half" fill="currentColor" stroke="none" className="w-4 h-4" />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <StarOff key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      ))}
    </div>
  );
}
