import { useEffect, useRef, useCallback } from "react";

export function useInfiniteScroll(
  callback: () => void,
  enabled: boolean
) {
  const observer = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect();
      if (!node || !enabled) return;

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            callback();
          }
        },
        { rootMargin: "200px" }
      );
      observer.current.observe(node);
    },
    [callback, enabled]
  );

  useEffect(() => {
    return () => observer.current?.disconnect();
  }, []);

  return sentinelRef;
}
