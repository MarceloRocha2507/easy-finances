import { useEffect, useRef, useCallback } from "react";

interface UseSwipeGestureOptions {
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  enabled: boolean;
  edgeThreshold?: number;
  swipeMinDistance?: number;
}

export function useSwipeGesture({
  onSwipeRight,
  onSwipeLeft,
  enabled,
  edgeThreshold = 30,
  swipeMinDistance = 50,
}: UseSwipeGestureOptions) {
  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      // Track if starting from left edge (to open) or anywhere (to close)
      tracking.current = true;
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !tracking.current) return;
      tracking.current = false;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX.current;
      const deltaY = Math.abs(touch.clientY - startY.current);

      // Ignore if vertical movement is greater than horizontal
      if (deltaY > Math.abs(deltaX)) return;

      if (deltaX > swipeMinDistance && startX.current <= edgeThreshold) {
        onSwipeRight();
      } else if (deltaX < -swipeMinDistance) {
        onSwipeLeft();
      }
    },
    [enabled, onSwipeRight, onSwipeLeft, edgeThreshold, swipeMinDistance]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchEnd]);
}
