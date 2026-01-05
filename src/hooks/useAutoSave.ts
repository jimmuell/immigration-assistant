'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoSaveOptions {
  delay?: number;
  onSave: () => Promise<void>;
}

export function useAutoSave({ delay = 2000, onSave }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const triggerAutoSave = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      if (!isSavingRef.current) {
        isSavingRef.current = true;
        try {
          await onSave();
        } finally {
          isSavingRef.current = false;
        }
      }
    }, delay);
  }, [delay, onSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { triggerAutoSave };
}
