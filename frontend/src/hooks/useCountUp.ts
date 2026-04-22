import { useEffect, useRef, useState } from 'react';

export function useCountUp(end: number, duration: number = 1500, start: number = 0) {
  const [count, setCount] = useState(start);
  const requestRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const animate = (time: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = time;
      }

      const elapsed = time - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Sine ease-out for ultra-smooth deceleration
      const eased = Math.sin((progress * Math.PI) / 2);
      const current = start + (end - start) * eased;

      setCount(current);

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [end, duration, start]);

  return Math.round(count);
}
