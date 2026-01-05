"use client";

import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  ratingCount?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export function RatingDisplay({ 
  rating, 
  ratingCount = 0, 
  size = "md",
  showCount = true 
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
      {showCount && ratingCount > 0 && (
        <span className={`${textSizeClasses[size]} text-gray-600`}>
          ({ratingCount})
        </span>
      )}
      <span className={`${textSizeClasses[size]} font-medium text-gray-700`}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

