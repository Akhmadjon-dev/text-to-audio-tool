import { useEffect, useRef, useState } from 'react';

/**
 * Sleep timer: after the chosen number of minutes, calls onExpire (e.g. pause).
 * 0 minutes = off.
 */
export function useSleepTimer(onExpire: () => void) {
  const [minutes, setMinutes] = useState(0);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    if (!minutes) return;
    const t = setTimeout(() => {
      onExpireRef.current();
      setMinutes(0);
    }, minutes * 60_000);
    return () => clearTimeout(t);
  }, [minutes]);

  return { minutes, setMinutes };
}
