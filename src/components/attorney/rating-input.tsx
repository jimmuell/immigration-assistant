"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}

export function RatingInput({ value, onChange, size = "md" }: RatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const displayRating = hoverRating || value;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= displayRating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-300 hover:text-gray-400"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}

