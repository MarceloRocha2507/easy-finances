import { useEffect, useRef, useCallback, useState } from "react";

interface UseSwipeGestureOptions {
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  enabled: boolean;
  edgeThreshold?: number;
  sidebarOpen?: boolean;
  sidebarWidth?: number;
}

interface SwipeGestureResult {
  dragOffset: number;
  isDragging: boolean;
}

export function useSwipeGesture({
  onSwipeRight,
  onSwipeLeft,
  enabled,
  edgeThreshold = 30,
  sidebarOpen = false,
  sidebarWidth = 280,
}: UseSwipeGestureOptions): SwipeGestureResult {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const direction = useRef<"open" | "close" | null>(null);
  const verticalLock = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return;
      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      verticalLock.current = false;

      if (!sidebarOpen && touch.clientX <= edgeThreshold) {
        tracking.current = true;
        direction.current = "open";
      } else if (sidebarOpen) {
        tracking.current = true;
        direction.current = "close";
      }
    },
    [enabled, sidebarOpen, edgeThreshold]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || !tracking.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - startX.current;
      const deltaY = Math.abs(touch.clientY - startY.current);

      // Lock out if vertical scroll detected early
      if (!isDragging && deltaY > Math.abs(deltaX) && deltaY > 10) {
        verticalLock.current = true;
        tracking.current = false;
        return;
      }
      if (verticalLock.current) return;

      if (Math.abs(deltaX) > 5) {
        setIsDragging(true);
      }

      if (direction.current === "open") {
        const offset = Math.max(0, Math.min(deltaX, sidebarWidth));
        setDragOffset(offset);
      } else if (direction.current === "close") {
        const offset = Math.max(0, Math.min(-deltaX, sidebarWidth));
        setDragOffset(offset);
      }
    },
    [enabled, isDragging, sidebarWidth]
  );

  const handleTouchEnd = useCallback(() => {
    if (!enabled || !tracking.current) return;
    tracking.current = false;

    const threshold = sidebarWidth * 0.4;

    if (direction.current === "open" && dragOffset > threshold) {
      onSwipeRight();
    } else if (direction.current === "close" && dragOffset > threshold) {
      onSwipeLeft();
    }
    // else: snap back (dragOffset resets to 0)

    setDragOffset(0);
    setIsDragging(false);
    direction.current = null;
  }, [enabled, dragOffset, sidebarWidth, onSwipeRight, onSwipeLeft]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { dragOffset, isDragging };
}
